var Discord = require('discord.js');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var problems;
function read(err, data) {problems = data.split('\n');}
require('fs').readFile('problems.txt', 'utf8', read);

var auth = require('/users/jason/logins.json');
var client = new Discord.Client();

var prefix = '-';

var leaderboard_msg = undefined;
var leaderboard_org = 0;
var leaderboard_min = 0;

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
        message.channel.send(`\`\`\`-ping : pings the bot\n-get_pp user : gets pp of user\n-leaderboard org : gets leaderboard of organization based on pp\n-problems list : lists weekly problems\n-problems org : gets leaderboard of organization based on weekly problems\nMarkville organization code is 138\n\`\`\``);
    } else if (cmd === 'get_pp') {
        if (args.length < 1) {
            message.channel.send(`\`\`\`Please enter a username\`\`\``);
            return;
        }
        var response = get_http(`https://dmoj.ca/api/v2/user/${args[0]}`, message);
        if ('data' in response) {
            message.channel.send(`\`\`\`${(args[0] + ':').padEnd(15)} ${response.data.object.performance_points.toFixed(2)}pp\`\`\``);
        }
    } else if (cmd === 'leaderboard') {
        if (args.length < 1) {
            message.channel.send(`\`\`\`Please enter an organization id\`\`\``);
            return;
        }
        var response = get_http(`https://dmoj.ca/api/v2/users?organization=${args[0]}`, message);
        if ('data' in response) {
            var users = response.data.objects;
            var print_str = `\`\`\`\n`;

            users.sort(function(a, b) {
                if (a.performance_points < b.performance_points) return 1;
                if (a.performance_points > b.performance_points) return -1;
                return 0;
            });
            users.forEach(function(obj) {
                print_str = print_str.concat(`${(obj.username + ':').padEnd(15)} ${obj.performance_points.toFixed(2)}pp\n`);
            });

            print_str = print_str.concat(`\`\`\``);
            message.channel.send(print_str);
        }
    } else if (cmd === 'problems') {
        if (args.length < 1) {
            message.channel.send(`\`\`\`Please enter an organization id\`\`\``);
            return;
        }

        if (args[0] === 'list') {
            var print_str = `\`\`\`\n`;
            problems.forEach(function(problem) {
                var response = get_http(`https://dmoj.ca/api/v2/problem/${problem}`, message);
                if (!'data' in response) return;
                print_str = print_str.concat(response.data.object.name).concat('\n');
            });
            message.channel.send(print_str.concat(`\`\`\``));
            return;
        }
        
        var total_points = 0;
        var user_points = [];
        var users = [];

        var users_response = get_http(`https://dmoj.ca/api/v2/users?organization=${args[0]}`, message);
        if (!'data' in users_response) return;
        users = users_response.data.objects;
        users.forEach(function(user) {user_points.push({'name': user.username, 'points': 0})});
        problems.forEach(function(problem) {
            // console.log(`Looking through problem ${problem}`);
            submissions = [];
            page = 1;
            while (true) {
                var submissions_response = get_http(`https://dmoj.ca/api/v2/submissions?problem=${problem}&result=AC&page=${page}`, message);
                if (!'data' in submissions_response) return;
                submissions = submissions.concat(submissions_response.data.objects);
                if (page === 1) total_points += submissions_response.data.objects[0].points;
                if (page >= submissions_response.data.total_pages) break;
                page++;
            }
            for (var i = 0; i < users.length; i++) {
                submissions.some(function(submission) {
                    if (submission.user === users[i].username) {
                        if (submission.user !== user_points[i].name) {
                            console.log("Something broke aaahhhhh");
                            return false;
                        }
                        console.log(submission.user);
                        user_points[i].points += submission.points;
                        return true;
                    }
                    return false;
                });
            }
        });
        user_points.sort(function (a, b) {
            if (a.points < b.points) return 1;
            if (a.points > b.points) return -1;
            return 0;
        });
        var print_str = `\`\`\`\n`;
        user_points.forEach(function(obj) {
            print_str = print_str.concat(`${(obj.name + ':').padEnd(15)} ${obj.points.toFixed(0).padStart(3)}/${total_points}\n`);
        });
        print_str = print_str.concat(`\`\`\``);
        message.channel.send(print_str);  
    }
});

client.login(auth.discord_token);