var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');
var pg = require('pg');
var request = require("request");

var conString = "postgres://" + config.db.username + ":" + config.db.password + "@" + config.db.host + ":" + config.db.port + "/" + config.db.name;
var client = new pg.Client(conString);
client.connect();

var app = express();

app.use(bodyParser.json());


app.post('/user', function (req, res) {
    let id = req.body.id;
    let token = req.body.token;
    let email_id = req.body.email_id;
    let name = req.body.name;

    let check_sql = "select id from users where email_id=$1"

    client.query(check_sql, [email_id], function (err, response) {
        if (err) {
            res.send({
                success: false,
                error: err
            })
        } else {
            if (response.rowCount == 0) {
                let sql = `
                insert into users(token_data,email_id,name)
                values($1, $2, $3) returning id
            `

                client.query(sql, [
                    { id: id, token: token },
                    email_id,
                    name
                ], function (err, response) {
                    if (err) {
                        res.send({
                            success: false,
                            error: err
                        })
                    } else {
                        res.send({
                            success: true,
                            result: response.rows
                        })
                    }
                })
            }else{
                res.send({
                    success:true,
                    result:response.rows
                })
            }
        }
    })




})

app.post('/topic', function (req, res) {
    let user_id = req.body.user_id;
    let topic_text = req.body.topic_text;
    let sql = `
    insert into topic(user_id,topic_text,created_on,updated_on,expires_on)
    values($1,$2,now(),now(),now() + interval '1 day')
    `

    client.query(
        sql,
        [user_id, topic_text],
        function (err, response) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                })
            } else {
                res.send({
                    success: true,
                    result: response.rows
                })
            }
        }
    );
});

app.post('/question', function (req, res) {
    let topic_id = req.body.topic_id;
    let question_text = req.body.question_text;
    let question_type = req.body.question_type;
    let opt1 = req.body.opt1;
    let opt2 = req.body.opt2;
    let opt3 = req.body.opt3;
    let opt4 = req.body.opt4;
    let sql = `
    insert into question (topic_id,question_text,question_type,opt1,opt2,opt3,opt4)
    values($1,$2,$3,$4,$5,$6,$7)
    `;
    let params = [topic_id, question_text, question_type, opt1, opt2, opt3, opt4];
    if (question_type == 'yes_no') {
        sql = `
    insert into question (topic_id,question_text,question_type,opt1,opt2,opt3,opt4)
    values($1,$2,'yes_no','Yes','No',null,null)
    `;
        params = [topic_id, question_text]
    }
    console.log(sql)
    client.query(
        sql,
        params,
        function (err, response) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                })
            } else {
                res.send({
                    success: true,
                    result: response.rows
                })
            }
        })
});

app.delete('/question/:id', function (req, res) {
    let id = req.params.id;
    let sql = "delete from question where id=$1";
    client.query(
        sql,
        [id],
        function (err, response) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                })
            } else {
                res.send({
                    success: true,
                    result: response.rows
                })
            }
        })
});
app.put('/question/:id', function (req, res) {
    let id = req.params.id;
    let question_text = req.body.question_text;
    let question_type = req.body.question_type;
    let opt1 = req.body.opt1;
    let opt2 = req.body.opt2;
    let opt3 = req.body.opt3;
    let opt4 = req.body.opt4;
    let sql = `
        update question set question_text=$2,question_type='multiple',
        opt1=$3,opt2=$4,opt3=$5,opt4=$6 where id=$1	
    `
    let params = [id, question_text, opt1, opt2, opt3, opt4];
    if (question_type == 'yes_no') {
        sql = `
        update question set question_text=$2,question_type='yes_no',
        opt1='Yes',opt2='No',opt3=null,opt4=null where id=$1	
    `;
        params = [id, question_text]

    }
    client.query(
        sql,
        params,
        function (err, response) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                })
            } else {
                res.send({
                    success: true,
                    result: response.rows
                })
            }
        })
})

app.post('/user_link', function (req, res) {
    let topic_id = req.body.topic_id;
    let phone_no = req.body.phone_no;
    let sql = `
        insert into user_link(topic_id,phone_no)
        values ($1,$2) returning id`;

    client.query
        (
            sql,
            [topic_id, phone_no],
            function (err, response) {
                if (err) {
                    res.send({
                        success: false,
                        error: err
                    })
                } else {

                    var options = {
                        method: 'GET',
                        url: 'https://api.textlocal.in/send/',
                        qs:
                        {
                            apikey: config.smsAPIKey,
                            numbers: '91' + phone_no,
                            message: 'Hi welocme to letsurvey, please click on http://letsurvey.tk/link/' + response.rows[0].id + ' to proceed',
                            sender: config.smsSender
                        }
                    };

                    request(options, function (error, response, body) {
                        if (error) throw new Error(error);

                        console.log(body);
                    });
                    res.send({
                        success: true,
                        result: response.rows
                    })
                }
            }
        )
}

)

app.post('/user_response', function (req, res) {
    let user_link_id = req.body.user_link_id;
    let question_id = req.body.question_id;
    let response = req.body.response;
    let sql = `
        insert into user_response(user_link_id,question_id,response,created_on)
        values($1,$2,$3,now())`
    client.query
        (
            sql,
            [user_link_id, question_id, response],
            function (err, response) {
                if (err) {
                    res.send({
                        success: false,
                        error: err
                    })
                } else {
                    res.send({
                        success: true,
                        result: response.rows
                    })
                }
            }
        )
}
)

app.get('/link_questions/:id',function(req,res)
    {
        let id = req.params.id;
        let sql = `select q.* from user_link ul inner join question q on ul.topic_id=q.topic_id
        where ul.id=$1`
        client.query
        (
            sql,
            [id],
            function (err, response) {
                if (err) {
                    res.send({
                        success: false,
                        error: err
                    })
                } else {
                    res.send({
                        success: true,
                        result: response.rows
                    })
                }
            }
        )

    }
)

app.get('/topic_questions/:id',function (req, res)
    {
        let id = req.params.id;
        let sql = 'select * from question where topic_id=$1';
        client.query
        (
            sql,
            [id],
            function (err, response) {
                if (err) {
                    res.send({
                        success: false,
                        error: err
                    })
                } else {
                    res.send({
                        success: true,
                        result: response.rows
                    })
                }
            }
        )
    }
)

app.use('/', function (req, res) {
    res.send('Hello')
});
app.listen(8081, function (err) {
    if (err) {
        console.log('Error ' + err)
    } else {
        console.log('Running')
    }
})