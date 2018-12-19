create table users (
	id serial primary key,
	token_data json,
	email_id varchar (100), 
	name varchar (100)
);


create table topic (
	id serial primary key,
	user_id	integer references users(id),
	topic_text	varchar	(2000),
	created_on	timestamp	,
	updated_on	timestamp	,
	expires_on	timestamp	
);


create table question (
	id serial primary key,
	topic_id	integer	references topic(id),
	questioin_text	varchar	(1000),
	question_type	varchar	(10),
	opt1	varchar	(1000),
	opt2	varchar	(1000),
	opt3	varchar	(1000),
	opt4	varchar	(1000)
)

create table user_link (
	id serial primary key,
	topic_id	integer references topic(id),
	phone_no	varchar	(10)
)

create table user_responce (
	id serial primary key,
	user_link_id	integer references user_link(id),
	question_id	integer references question(id),
	response	integer,
	created_on	timestamp
)