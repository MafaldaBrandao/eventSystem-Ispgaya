-- Auto-generated from infocultura.sqlalchemy_models
-- Regenerate with: python -m infocultura.generate_sqlalchemy_ddl

CREATE TABLE category (
	id_category INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(120) NOT NULL, 
	description TEXT NOT NULL, 
	updated_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_category)
);

CREATE TABLE clubs (
	id_clubs INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	description TEXT NOT NULL, 
	mission TEXT NOT NULL, 
	is_active BOOL NOT NULL, 
	enable_registrations BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_clubs)
);

CREATE TABLE news_letter_subscribers (
	id_newsletter_sub INTEGER NOT NULL AUTO_INCREMENT, 
	email VARCHAR(255) NOT NULL, 
	is_active BOOL NOT NULL, 
	subscribed_at DATETIME NOT NULL, 
	PRIMARY KEY (id_newsletter_sub), 
	UNIQUE (email)
);

CREATE TABLE nstatus (
	id_nstatus INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	PRIMARY KEY (id_nstatus)
);

CREATE TABLE `role` (
	id_role INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	PRIMARY KEY (id_role)
);

CREATE TABLE rstatus (
	id_rstatus INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	PRIMARY KEY (id_rstatus)
);

CREATE TABLE books (
	id_books INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	author VARCHAR(255) NOT NULL, 
	publisher VARCHAR(255) NOT NULL, 
	publication_year INTEGER NOT NULL, 
	cover_image VARCHAR(500) NOT NULL, 
	summary TEXT NOT NULL, 
	is_active BOOL NOT NULL, 
	is_featured BOOL NOT NULL, 
	id_club INTEGER, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_books), 
	FOREIGN KEY(id_club) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE news (
	id_news INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	summary TEXT NOT NULL, 
	image VARCHAR(500) NOT NULL, 
	is_active BOOL NOT NULL, 
	published_at DATETIME, 
	content TEXT NOT NULL, 
	id_nstatus INTEGER NOT NULL, 
	id_clubs INTEGER, 
	updated_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_news), 
	FOREIGN KEY(id_nstatus) REFERENCES nstatus (id_nstatus), 
	FOREIGN KEY(id_clubs) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE registrations (
	id_registrations INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	phone VARCHAR(50) NOT NULL, 
	message TEXT NOT NULL, 
	id_rstatus INTEGER, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_registrations), 
	FOREIGN KEY(id_rstatus) REFERENCES rstatus (id_rstatus) ON DELETE SET NULL
);

CREATE TABLE sessions (
	id_sessions INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	session_date DATE NOT NULL, 
	start_date DATETIME NOT NULL, 
	end_date DATETIME NOT NULL, 
	location VARCHAR(255) NOT NULL, 
	is_active BOOL NOT NULL, 
	id_club INTEGER, 
	updated_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_sessions), 
	FOREIGN KEY(id_club) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE user (
	id_user INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	is_active BOOL NOT NULL, 
	id_role INTEGER NOT NULL, 
	id_clubs INTEGER, 
	updated_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_user), 
	UNIQUE (email), 
	FOREIGN KEY(id_role) REFERENCES `role` (id_role), 
	FOREIGN KEY(id_clubs) REFERENCES clubs (id_clubs)
);

CREATE TABLE clubs_registrations (
	id_clubs INTEGER NOT NULL, 
	id_registrations INTEGER NOT NULL, 
	PRIMARY KEY (id_clubs, id_registrations), 
	FOREIGN KEY(id_clubs) REFERENCES clubs (id_clubs) ON DELETE CASCADE, 
	FOREIGN KEY(id_registrations) REFERENCES registrations (id_registrations)
);

CREATE TABLE event (
	id_event INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	event_date DATE NOT NULL, 
	start_date DATETIME NOT NULL, 
	end_date DATETIME NOT NULL, 
	image VARCHAR(500) NOT NULL, 
	is_active BOOL NOT NULL, 
	is_external BOOL NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	city VARCHAR(120) NOT NULL, 
	location VARCHAR(255) NOT NULL, 
	user_id INTEGER, 
	updated_at DATETIME NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_event), 
	FOREIGN KEY(user_id) REFERENCES user (id_user) ON DELETE SET NULL
);

CREATE TABLE newsletters (
	id_newsletter INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	subject VARCHAR(255) NOT NULL, 
	content TEXT NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	sent_at DATETIME, 
	user_id INTEGER, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id_newsletter), 
	FOREIGN KEY(user_id) REFERENCES user (id_user) ON DELETE SET NULL
);

CREATE TABLE event_category (
	id_event INTEGER NOT NULL, 
	id_category INTEGER NOT NULL, 
	PRIMARY KEY (id_event, id_category), 
	FOREIGN KEY(id_event) REFERENCES event (id_event), 
	FOREIGN KEY(id_category) REFERENCES category (id_category)
);
