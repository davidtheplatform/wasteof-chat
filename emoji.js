var all_emojis = JSON.parse(localStorage.getItem("all_emojis"));
if (all_emojis === null) all_emojis = {};

function add_emoji(code, source) {
    all_emojis[code] = source;
    localStorage.setItem("all_emojis", JSON.stringify(all_emojis));
}

function create_html(emoji) {
    return emoji;
}

function create_html_from_code(code) {
    code = code.replaceAll(":", "");

    console.log(all_emojis[code], code);
    if (all_emojis[code] === undefined) return code;
    return create_html(all_emojis[code]);
}

window.emoji_create_html = create_html_from_code;

// add default emojis
fetch("initial_emojis.csv")
    .then(result => {
        result.text()
            .then(text => {
                text.split("\n").forEach(entry => {
                    var codes = entry.split(',');
                    for (var i = 1; i < codes.length; i++) {
                        all_emojis[codes[i]] = codes[0];
                    }
                });
                localStorage.setItem("all_emojis", JSON.stringify(all_emojis));
            })
    });

// build emoji picker
var picker = document.getElementById("button_container");
var added_emojis = [];
var picker_content = ""
for (const [code, emoji] of Object.entries(all_emojis)) {
    if (added_emojis.indexOf(emoji) == -1) {
        picker_content += `<div class="emoji_button" title=":${code}:">${create_html(emoji)}</div>`;
        added_emojis.push(emoji);
    }
}
added_emojis = null;
picker.innerHTML = picker_content;


document.getElementById("emoji_picker_button").onclick = () => {
    document.getElementById("emoji_picker").hidden = !document.getElementById("emoji_picker").hidden;
}
document.getElementById("button_container").onclick = event => {
    console.log(event.target);
    if (event.target.classList.contains("emoji_button")) {
        console.log("yes");
        document.getElementById("messagebox").value += event.target.title;
    }
}