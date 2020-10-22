var Discord = require('discord.js');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var auth = require('/users/jason/logins.json');
var dmoj = require('./dmoj.json');

async function get_http(url) {
    console.log('Getting: '.concat(url));
    await new Promise(resolve => setTimeout(resolve, 1000));
    var response = [];
    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', url, false);
    xhttp.setRequestHeader("Authorization", `Bearer ${auth.dmoj_token}`);
    xhttp.onload = function() {
        response = JSON.parse(xhttp.responseText);
    };
    xhttp.onerror = function() {
        message.channel.send(`\`\`\`Something went wrong :(\`\`\``);
        reponse = null;
    };
    xhttp.send();
    return response;
}

async function asyncForEach(arr, func) {
	for (var i in arr) {
		await func(arr[i]);
	}
}

async function main() {
	console.log('Grabbing DMOJ');

	// Grab Problem Names
	await asyncForEach(dmoj.problems, async problem => {
		var response = await get_http(`https://dmoj.ca/api/v2/problem/${problem.id}`);
		if (response !== undefined && 'data' in response) {
			problem.name = response.data.object.name;
			problem.pp = response.data.object.points;
		}
	});

	// Grab Leaderboard and Problem Board
	dmoj.leaderboard = [];
	dmoj.problem_board = [];
	await asyncForEach(dmoj.users, async user => {
		var response = await get_http(`https://dmoj.ca/api/v2/user/${user}`);
		if (response !== undefined && 'data' in response) {
			dmoj.leaderboard.push({"user": user, "pp": parseFloat(response.data.object.performance_points)});
			dmoj.problem_board.push({'user': user, 'pp': 0});
			await asyncForEach(dmoj.problems, async problem => {
				if (response.data.object.solved_problems.includes(problem.id)) {
					dmoj.problem_board[dmoj.problem_board.length - 1].pp += problem.pp;
				}
			});
		}
	});
	dmoj.leaderboard.sort(function(a, b) {
	    if (a.pp < b.pp) return 1;
	    if (a.pp > b.pp) return -1;
	    return 0;
	});
	dmoj.problem_board.sort(function(a, b) {
	    if (a.pp < b.pp) return 1;
	    if (a.pp > b.pp) return -1;
	    return 0;
	});

	require('fs').readFile('dmoj.json', 'utf8', (err, data) => {
        new_users = JSON.parse(data).users;
        dmoj.users = new_users;
        require('fs').writeFile('dmoj.json', JSON.stringify(dmoj, null, 4), function writeJSON(err) {
		  if (err) return console.log(err);
		  console.log('Saving DMOJ');
		});
    });
	

}

main();