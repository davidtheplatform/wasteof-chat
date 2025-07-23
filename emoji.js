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

var picker = document.getElementById("button_container");
function build_picker() {
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
}
build_picker();

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

document.getElementById("messagebox").addEventListener("input", event => {
    var emoji_list = document.getElementById("emoji_list");

    // find shortcode fragment
    var rev = event.target.value.split('').reverse().join('');
    var code = rev.match(/:?[a-zA-Z0-9_\-]+:/g);
    if (code === null) {
        emoji_list.hidden = true;
        return; // text doesn't have any fragments
    }
    code = code[0];

    if (!rev.startsWith(code)) {
        emoji_list.hidden = true;
        return; // last fragment isn't at the end
    }
    code = code.split('').reverse().join('');

    // fragment is complete, try to replace it
    if (rev.startsWith(':')) {
        event.target.value = event.target.value.slice(0, event.target.value.length - code.length);
        event.target.value += create_html_from_code(code);
        emoji_list.hidden = true;
    } else {
        code = code.replaceAll(':', '');
        var results = fuzzysort.go(code, Object.keys(all_emojis), {
            limit: 10
        });

        emoji_list.innerHTML = '';
        emoji_list.hidden = results.length == 0;

        results.forEach(result => {
            emoji_list.innerHTML +=
`<div id="emoji_list_element">
    ${create_html_from_code(result.target)} :${result.target}:
</div>`
        });
    }
});

var emoji_searchbar = document.getElementById("emoji_searchbar");

emoji_searchbar.oninput = event => {
    var code = event.target.value.replaceAll(':', '');
    if (code === '') {
        build_picker();
        return;
    }

    var results = fuzzysort.go(code, Object.keys(all_emojis), {
        threshold: 0.5,
        limit: 100,
    });

    var resultHtml = '';
    results.forEach(result => {
        resultHtml += `<div class="emoji_button" title=":${result.target}:">${create_html_from_code(result.target)}</div>`;
    });

    picker.innerHTML = resultHtml;
};