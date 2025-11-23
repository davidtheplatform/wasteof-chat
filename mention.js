let seen_users = {};

if (localStorage.getItem("seen_users") !== null) {
    seen_users = JSON.parse(localStorage.getItem("seen_users"));
}
window.seen_users = seen_users;

window.message_handlers.push((socket) => {
    seen_users[socket.from.name.toLowerCase()] = socket.from;
    localStorage.setItem("seen_users", JSON.stringify(seen_users));
});

function create_mention(user) {
    if (window.seen_users.hasOwnProperty(user)) {
        return `<a href="https://wasteof.money/users/${user}" data-color="${seen_users[user].color}">@${seen_users[user].name}</a>`;
    } else {
        return `<a href="https://wasteof.money/users/${user}" data-color="default">@${user}</a>`;
    }
}

window.create_mention = create_mention;