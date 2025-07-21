import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";
var converter = new showdown.Converter({
	extensions: ["remove_p_tag", "emojis"],
});

var socket;

if (localStorage.getItem('token') === null) {
	socket = io.connect("wss://api.wasteof.money/");
} else {
	socket = io.connect("wss://api.wasteof.money/",
		{
			auth: {
				token: localStorage.getItem('token')
			}
		});
	
	show_ui();
}
window.socket = socket;

const messagebox = document.getElementById("messagebox");

function add_message(author, content, timestamp) {
	var post = `
<div>
	<span>${author}</span> : 
	<span>${content}</span>
</div>`;

	var messageDiv = document.createElement('div');
	messageDiv.innerHTML = post;

	document.getElementById("postlist").appendChild(messageDiv);
}
window.add_message = add_message;

function send_message(content) {
	messagebox.value = "";

	var rendered = converter.makeHtml(content);

	socket.emit("message", rendered);
}

function show_ui() {
	document.getElementById("loginarea").hidden = true;
	document.getElementById("inputarea").hidden = false;
}

socket.on('message', (socket) => {
	console.log('message:', socket);
	add_message(socket.from.name, socket.content, socket.time);
});

document.getElementById("sendmessage").onclick = () => {
	send_message(messagebox.value);
}

messagebox.onkeydown = (e) => {
	if (e.key == 'Enter') {
		send_message(messagebox.value);
	}
}

document.getElementById("loginbutton").onclick = () => {
	var username = document.getElementById("username");
	var password = document.getElementById("password");

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
				console.log('token is', token.token);

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
}