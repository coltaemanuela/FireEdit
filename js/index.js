$(function() {

    // Initialize Firebase configuration
    var config = {
        apiKey: "AIzaSyAsFK9oDTtsCdqrHAfQKs8_TmNtBOoIkBY",
        authDomain: "emma-ea74d.firebaseapp.com",
        databaseURL: "https://emma-ea74d.firebaseio.com",
        storageBucket: "emma-ea74d.appspot.com",
        messagingSenderId: "95300595436"
    };
    firebase.initializeApp(config);
    
    // Get the editor id, using Url.js
    // The queryString method returns the value of the id querystring parameter
    // We default to "_", for users which do not use a custom id.
    var editorId = Url.queryString("id") || "_";
    
    // This is the local storage field name where we store the user theme
    // We set the theme per user, in the browser's local storage
    var LS_THEME_KEY = "editor-theme";

    // This function will return the user theme or the Monokai theme (which
    // is the default)
    function getTheme() {
        return localStorage.getItem(LS_THEME_KEY) || "ace/theme/monokai";
    }
    
    // Select the desired theme of the editor
    $("#select-theme").change(function () {
        // Set the theme in the editor
        editor.setTheme(this.value);
        
        // Update the theme in the localStorage
        // We wrap this operation in a try-catch because some browsers don't
        // support localStorage (e.g. Safari in private mode)
        try {
            localStorage.setItem(LS_THEME_KEY, this.value);
        } catch (e) {}
    }).val(getTheme());
    
    // Select the desired programming language you want to code in 
    var $selectLang = $("#select-lang").change(function () {
        // Set the language in the Firebase object
        // This is a preference per editor
        currentEditorValue.update({
            lang: this.value
        });
        // Set the editor language
        editor.getSession().setMode("ace/mode/" + this.value);
    });

    // Generate a pseudo user id
    // This will be used to know if it's me the one who updated
    // the code or not
    var uid = Math.random().toString();
    var editor = null;
    // Make a reference to the database
    var db = firebase.database();
    
    // Write the entries in the database 
    var editorValues = db.ref("editor_values");
    
    // Get the current editor reference
    var currentEditorValue = editorValues.child(editorId);
    
    // Store the current timestamp (when we opened the page)
    // It's quite useful to know that since we will
    // apply the changes in the future only
    var openPageTimestamp = Date.now();

    // Take the editor value on start and set it in the editor
    currentEditorValue.child("content").once("value", function (contentRef) {

        // Somebody changed the lang. Hey, we have to update it in our editor too!
        currentEditorValue.child("lang").on("value", function (r) {
            var value = r.val();
            // Set the language
            var cLang = $selectLang.val();
            if (cLang !== value) {
                $selectLang.val(value).change();
            }
        });

        // Hide the spinner
        $("#loader").fadeOut();
        $("#editor").fadeIn();

        // Initialize the ACE editor
        editor = ace.edit("editor");
        editor.setTheme(getTheme());
        editor.$blockScrolling = Infinity;

        // Get the queue reference
        var queueRef = currentEditorValue.child("queue");
        
        // This boolean is going to be true only when the value is being set programmatically
        // We don't want to end with an infinite cycle, since ACE editor triggers the
        // `change` event on programmatic changes (which, in fact, is a good thing)
        var applyingDeltas = false;

        // When we change something in the editor, update the value in Firebase
        editor.on("change", function(e) {
                    
            // In case the change is emitted by us, don't do anything
            // (see below, this boolean becomes `true` when we receive data from Firebase)
            if (applyingDeltas) {
                return;
            }

            // Set the content in the editor object
            // This is being used for new users, not for already-joined users.
            currentEditorValue.update({
                content: editor.getValue()
            });

            // Generate an id for the event in this format:
            //  <timestamp>:<random>
            // We use a random thingy just in case somebody is saving something EXACTLY
            // in the same moment
            queueRef.child(Date.now().toString() + ":" + Math.random().toString().slice(2)).set({
                event: e,
                by: uid
            }).catch(function(e) {
                console.error(e);
            });
        });

        // Get the editor document object 
        var doc = editor.getSession().getDocument();

        // Listen for updates in the queue
        queueRef.on("child_added", function (ref) {
        
            // Get the timestamp
            var timestamp = ref.key.split(":")[0];
        
            // Do not apply changes from the past
            if (openPageTimestamp > timestamp) {
                return;
            }
        
            // Get the snapshot value
            var value = ref.val();
            
            // In case it's me who changed the value, I am
            // not interested to see twice what I'm writing.
            // So, if the update is made by me, it doesn't
            // make sense to apply the update
            if (value.by === uid) { return; }
        
            // We're going to apply the changes by somebody else in our editor
            //  1. We turn applyingDeltas on
            applyingDeltas = true;
            //  2. Update the editor value with the event data
            doc.applyDeltas([value.event]);
            //  3. Turn off the applyingDeltas
            applyingDeltas = false;
        });

        // Get the current content
        var val = contentRef.val();
        
        // If the editor doesn't exist already....
        if (val === null) {
            // ...we will initialize a new one. 
            // ...with this content:
            val = "/* Welcome to FireEdit! */";

            // Here's where we set the initial content of the editor
            editorValues.child(editorId).set({
                lang: "javascript",
                queue: {},
                content: val
            });
        }

        // We're going to update the content, so let's turn on applyingDeltas 
        applyingDeltas = true;
        
        // ...then set the value
        // -1 will move the cursor at the begining of the editor, preventing
        // selecting all the code in the editor (which is happening by default)
        editor.setValue(val, -1);
        
        // ...then set applyingDeltas to false
        applyingDeltas = false;
        
        // And finally, focus the editor!
        editor.focus();
    });
});