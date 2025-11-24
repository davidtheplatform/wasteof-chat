import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
var converter = new showdown.Converter({
	extensions: ["remove_p_tag", "custom_image", "emojis", "br_to_p"],
});

var incoming_converter = new showdown.Converter({
	extensions: ["remove_p_tag", "highlight_mention", "mentions"],
});

converter.setOption("simplifiedAutoLink", true);
converter.setOption("strikethrough", true);
converter.setOption("simpleLineBreaks", true);

var socket;
if (localStorage.getItem('token') !== null && localStorage.getItem('token').length != 96) localStorage.removeItem('token'); // token is probably wrong
if (localStorage.getItem('token') === null) {
	socket = io.connect("wss://api.wasteof.money/");
} else {
	socket = io.connect("wss://api.wasteof.money/",
		{
			auth: {
				token: localStorage.getItem('token')
			}
		});

	fetch("https://api.wasteof.money/session", {
		headers: {
			Authorization: localStorage.getItem('token')
		}
	}).then(response => {
		response.json().then(user => {
			window.current_user = user.user.name;
		});
		// window.current_user = response.json()
	});

	show_ui();
}
window.socket = socket;

const messagebox = document.getElementById("messagebox");

function add_message(author, content, timestamp) {
	content = window.sanitizeHtml(content, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
		allowedAttributes: {
			a: ['href', 'name', 'target', 'data-color'],
			span: ['data-highlight'],
			img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
		},
	});

	content = incoming_converter.makeHtml(content);

	var post = `
<div class="message" id="message_${timestamp}" title="${timestamp}">
	${window.create_mention(author)} : 
	<span>${content}</span>
	<div class="messageoptions">
		<button class="replybutton">reply</button>
	</div>
</div>`;

	var messageDiv = document.createElement('div');
	messageDiv.innerHTML = post;

	var postlist = document.getElementById("postlist");
	var atBottom = false;
	if (Math.abs(postlist.scrollTop - postlist.scrollTopMax) <= 5) atBottom = true; // typing in the message box scrolls the post list up by 4px
	console.log(postlist.scrollTop, postlist.scrollTopMax, atBottom);

	postlist.appendChild(messageDiv);

	if (atBottom) postlist.scrollTop = postlist.scrollTopMax;
}
window.add_message = add_message;

var reply = null;

function send_message(content) {
	messagebox.value = "";

	var rendered = converter.makeHtml(content);

	if (reply !== null) {
		rendered =
			`<blockquote>
	<p>💬 ${reply.user} <i>${reply.content}</i></p>
	<script>${reply.user}@${reply.timestamp}</script>
</blockquote>
${rendered}`
	}

	reply = null;
	document.getElementById("replybox").hidden = true;

	socket.emit("message", rendered);
}

function show_ui() {
	document.getElementById("loginarea").hidden = true;
	document.getElementById("inputarea").hidden = false;
}

var message_handlers = [];
window.message_handlers = message_handlers;
message_handlers.push((socket) => {
	console.log('message:', socket);
	add_message(socket.from.name, socket.content, socket.time);
});

socket.on('message', (socket) => {
	message_handlers.forEach((handler) => {
		handler(socket);
	});
});

document.getElementById("sendmessage").onclick = () => {
	send_message(messagebox.value);
}

messagebox.onkeydown = (e) => {
	if (e.key == 'Enter' && !e.shiftKey) {
		send_message(messagebox.value);
		e.preventDefault();
	}
}

document.getElementById("postlist").onclick = event => {
	if (event.target.classList.contains("replybutton")) {
		var user = event.target.parentElement.parentElement.children[0].innerText;
		var replycontent = event.target.parentElement.parentElement.children[1].innerText;
		var timestamp = Date.parse(event.target.parentElement.parentElement.title);

		reply = {
			user: user,
			content: replycontent,
			timestamp: timestamp,
		}

		var replybox = document.getElementById("replybox");
		var reply_details = document.getElementById("reply_details");
		reply_details.innerHTML = `Replying to @${reply.user}: <i>${window.sanitizeHtml(reply.content.slice(0, 100))}</i>`;
		replybox.hidden = false;

		var box = document.getElementById("messagebox");
		box.focus();
	}
}

document.getElementById("loginbutton").onclick = () => {
	var username = document.getElementById("username");
	var password = document.getElementById("password");
	var token = document.getElementById("token");

	if (token != "") {
		localStorage.setItem('token', token.value);
		token.value = "";

		socket = io.connect("wss://api.wasteof.money/",
			{
				auth: {
					token: localStorage.getItem('token')
				}
			}
		);

		show_ui();

		return;
	}

	try {
		fetch("https://api.wasteof.money/session", {
			method: 'POST',
			body: JSON.stringify({ username: username.value, password: password.value }),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(response => {
			username.value = "";
			password.value = "";
			if (response.status == 200) {
				response.json().then((token) => {
					localStorage.setItem('token', token.token);

					socket = io.connect("wss://api.wasteof.money/",
						{
							auth: {
								token: localStorage.getItem('token')
							}
						}
					);

					show_ui();
				});
			} else {
				document.getElementById("loginmessage").innerText = "Failed to log in.";
			}
		});
	} catch {
		document.getElementById("loginmessage").innerText = "Could not reach the API. Try using a session token instead."
	}
}

document.querySelectorAll("textarea").forEach(function (textarea) {
	textarea.style.height = textarea.scrollHeight + "px";
	textarea.style.overflowY = "hidden";

	textarea.addEventListener("input", function () {
		this.style.height = "auto";
		this.style.height = this.scrollHeight + "px";
	});
});

document.getElementById("cancel_reply").onclick = () => {
	reply = null;
	document.getElementById("replybox").hidden = true;
};