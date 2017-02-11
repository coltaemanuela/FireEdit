$(function() {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAsFK9oDTtsCdqrHAfQKs8_TmNtBOoIkBY",
        authDomain: "emma-ea74d.firebaseapp.com",
        databaseURL: "https://emma-ea74d.firebaseio.com",
        storageBucket: "emma-ea74d.appspot.com",
        messagingSenderId: "95300595436"
    };
    firebase.initializeApp(config);

    var editorId=Url.queryString("id")||"_";
    var LS_THEME_KEY = "editor-theme";

    function getTheme() {
        return localStorage.getItem(LS_THEME_KEY) || "ace/theme/monokai";
    }

    $("#select-theme").change(function () {
        editor.setTheme(this.value);
        try {
            localStorage.setItem(LS_THEME_KEY, this.value);
        } catch (e) {}
    }).val(getTheme());

    var $selectLang = $("#select-lang").change(function () {
        currentEditorValue.update({
            lang: this.value
        });
        editor.getSession().setMode("ace/mode/" + this.value);
    });

    var uid = Math.random().toString();
    var editor = null;

    var db = firebase.database();
    var editorValues = db.ref("editor_values");
    var currentEditorValue = editorValues.child(editorId);
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

        var queueRef = currentEditorValue.child("queue");
        var applyingDeltas = false;

        // When we change something in the editor, update the value in Firebase
        editor.on("change", function(e) {
            if (applyingDeltas) {
                return;
            }

            currentEditorValue.update({
                content: editor.getValue()
            });

            queueRef.child(Date.now().toString() + ":" + Math.random().toString().slice(2)).set({
                event: e,
                by: uid
            }).catch(function(e) {
                console.error(e)
            });
        });


        var doc = editor.getSession().getDocument();

        // Take the editor value and set it in the editor
        queueRef.on("child_added", function (ref) {
            var timestamp = ref.key.split(":")[0];

            // Do not apply changes from the past
            if (openPageTimestamp > timestamp) {
                return;
            }

            var value = ref.val();
            editor.curOp = null;
            if (value.by === uid) { return; }

            applyingDeltas = true;
            doc.applyDeltas([value.event]);
            applyingDeltas = false;
        });

        var val = contentRef.val();
        var initialContent = "Welcome to FireEdit!";

        // Check if the editor id exists already.
        if (val === null) {
            editorValues.child(editorId).set({
                lang: "javascript",
                queue: {},
                content: initialContent
            })
            val = initialContent;
        }

        applyingDeltas = true;
        editor.setValue(val, -1);
        applyingDeltas = false;
        editor.focus();
    });
});
