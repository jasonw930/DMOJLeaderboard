var Discord = require('discord.js');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// var problems;
// function read(err, data) {problems = data.split('\n');}
// require('fs').readFile('problems.txt', 'utf8', read);

var auth = require('/users/jason/logins.json');
var client = new Discord.Client();

var prefix = '-';

function get_http(url, message) {
    console.log('Gettting: '.concat(url));
    var response = [];
    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', url, false);
    xhttp.setRequestHeader("Authorization", `Bearer ${auth.dmoj_token}`);
    xhttp.onload = function() {
        if (xhttp.status !== 200) {
            message.channel.send(`\`\`\`HTTP Error ${xhttp.status}\`\`\``);
        }
        response = JSON.parse(xhttp.responseText);
    };
    xhttp.onerror = function() {
        message.channel.send(`\`\`\`Something went wrong :(\`\`\``);
        reponse = null;
    };
    xhttp.send();
    return response;
}

function save_dmoj(dmoj) {
    require('fs').writeFile('dmoj.json', JSON.stringify(dmoj, null, 4), function writeJSON(err) {
      if (err) return console.log(err);
      console.log('Saving DMOJ');
    });
}

client.once('ready', () => {
    console.log('DMOJ Leaderboard Online');
});


client.on('message', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    args = message.content.slice(prefix.length).split(/ +/);
    cmd = args.shift().toLowerCase();

    if (cmd === 'ping') {
        message.channel.send('pong');
    } else if (cmd === 'help') {
        message.channel.send(`\`\`\`-ping : pings the bot\n-users : lists all users\n-get_pp [handle] : gets pp of user\n-leaderboard : gets leaderboard based on pp\n-list : lists weekly problems\n-problems : gets leaderboard of weekly problems\n-add [handle] : adds user to leaderboard\n-remove [handle] : removes user from leaderboard\`\`\``);
    } else if (cmd === 'get_pp') {
        if (args.length < 1) {
            message.channel.send(`\`\`\`Please enter a username\`\`\``);
            return;
        }
        var response = get_http(`https://dmoj.ca/api/v2/user/${args[0]}`, message);
        if ('data' in response) {
            message.channel.send(`\`\`\`${(args[0] + ':').padEnd(15)} ${response.data.object.performance_points.toFixed(2)}pp\`\`\``);
        }
    } else if (cmd === 'users') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            print_str = `\`\`\`\n`;
            dmoj.users.forEach(function(obj) {
                print_str = print_str.concat(`${obj}\n`);
            });
            message.channel.send(print_str.concat(`\`\`\``));
        });
    } else if (cmd === 'leaderboard') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            print_str = `\`\`\`\n`;
            dmoj.leaderboard.forEach(function(obj) {
                print_str = print_str.concat(`${(obj.user + ':').padEnd(15)} ${obj.pp.toFixed(2)}pp\n`);
            });
            message.channel.send(print_str.concat(`\`\`\``));
        });
    } else if (cmd === 'list') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            var print_str = `\`\`\`\n`;
            dmoj.problems.forEach(function(problem) {
                print_str = print_str.concat(problem.name).concat('\n');
            });
            message.channel.send(print_str.concat(`\`\`\``));
        });
    } else if (cmd === 'problems') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            total_points = 0;
            dmoj.problems.forEach(problem => total_points += problem.pp);

            var print_str = `\`\`\`\n`;
            dmoj.problem_board.forEach(function(obj) {
                print_str = print_str.concat(`${(obj.user + ':').padEnd(15)} ${obj.pp.toFixed(0).padStart(3)}/${total_points}\n`);
            });
            message.channel.send(print_str.concat(`\`\`\``));  
        });
    } else if (cmd === 'add') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            if (args.length < 1) {
                message.channel.send(`\`\`\`Please enter a username\`\`\``);
                return;
            }
            if (!dmoj.users.includes(args[0])) {
                dmoj.users.push(args[0]);
                save_dmoj(dmoj);
                message.channel.send(`\`\`\`Added ${args[0]}\`\`\``);
            } else {
                message.channel.send(`\`\`\`${args[0]} already added\`\`\``);
            }
        });
    } else if (cmd === 'remove') {
        require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
            dmoj = JSON.parse(data);
            if (args.length < 1) {
                message.channel.send(`\`\`\`Please enter a username\`\`\``);
                return;
            }
            if (dmoj.users.includes(args[0])) {
                dmoj.users.splice(dmoj.users.indexOf(args[0]), 1);
                save_dmoj(dmoj);
                message.channel.send(`\`\`\`Removed ${args[0]}\`\`\``);
            } else {
                message.channel.send(`\`\`\`${args[0]} not found\`\`\``);
            }
        });
    }
});

client.login(auth.discord_token);