const mysql = require('mysql');

const connection = mysql.createConnection({
	host : '188.25.246.174',
	database : 'dtdatabase',
	user : 'root',
	password : ''
});

connection.connect(function(error){
	if(error)
	{
		throw error;
	}
	else
	{
		console.log('MySQL Database is connected Successfully');
	}
});

module.exports = connection;