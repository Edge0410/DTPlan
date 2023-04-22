const mysql = require('mysql');

const connection = mysql.createConnection({
	host : 'eduardoghepardo.go.ro',
	database : 'dtdatabase',
	user : 'MDS',
	password : 'metode0410'
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