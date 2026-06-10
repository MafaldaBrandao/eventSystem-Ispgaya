-- Auto-generated from infocultura.sqlalchemy_live_models
-- Regenerate with: python -m infocultura.generate_sqlalchemy_live_ddl

CREATE TABLE category (
	id_category INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(120) NOT NULL, 
	description TEXT NOT NULL, 
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_category)
);

CREATE TABLE clubs (
	id_clubs INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	mission TEXT, 
	is_active BOOL NOT NULL DEFAULT 1, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	enable_registrations BOOL, 
	PRIMARY KEY (id_clubs)
);

CREATE TABLE news_letter_subscribers (
	id_newsletter_sub INTEGER NOT NULL AUTO_INCREMENT, 
	email VARCHAR(255) NOT NULL, 
	is_active BOOL NOT NULL DEFAULT 1, 
	subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_newsletter_sub), 
	CONSTRAINT uq_news_letter_subscribers_email UNIQUE (email)
);

CREATE TABLE nstatus (
	id_nstatus INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	PRIMARY KEY (id_nstatus)
);

CREATE TABLE roles (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(50) NOT NULL, 
	description TEXT, 
	PRIMARY KEY (id), 
	CONSTRAINT name UNIQUE (name)
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
	publisher VARCHAR(255) NOT NULL DEFAULT '', 
	publication_year INTEGER NOT NULL, 
	cover_image VARCHAR(500) NOT NULL DEFAULT '', 
	summary TEXT NOT NULL, 
	is_active BOOL NOT NULL DEFAULT 1, 
	is_featured BOOL NOT NULL DEFAULT 0, 
	id_club INTEGER, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_books), 
	FOREIGN KEY(id_club) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE news (
	id_news INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	summary TEXT NOT NULL, 
	image VARCHAR(500) NOT NULL DEFAULT '', 
	is_active BOOL NOT NULL DEFAULT 1, 
	id_nstatus INTEGER NOT NULL, 
	published_at DATETIME, 
	id_clubs INTEGER, 
	content TEXT NOT NULL, 
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_news), 
	FOREIGN KEY(id_nstatus) REFERENCES nstatus (id_nstatus), 
	FOREIGN KEY(id_clubs) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE registrations (
	id_registrations INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(150) NOT NULL, 
	phone VARCHAR(20), 
	message TEXT, 
	status VARCHAR(50) NOT NULL DEFAULT 'pending', 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	id_rstatus INTEGER, 
	PRIMARY KEY (id_registrations), 
	CONSTRAINT fk_registrations_rstatus FOREIGN KEY(id_rstatus) REFERENCES rstatus (id_rstatus) ON DELETE SET NULL
);

CREATE TABLE sessions (
	id_sessions INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	session_date DATE NOT NULL, 
	start_date DATETIME NOT NULL, 
	end_date DATETIME NOT NULL, 
	location VARCHAR(255) NOT NULL DEFAULT '', 
	is_active BOOL NOT NULL DEFAULT 1, 
	id_club INTEGER, 
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_sessions), 
	FOREIGN KEY(id_club) REFERENCES clubs (id_clubs) ON DELETE SET NULL
);

CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	email VARCHAR(150) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role_id INTEGER NOT NULL, 
	is_active BOOL DEFAULT 1, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	id_clubs INTEGER, 
	PRIMARY KEY (id), 
	CONSTRAINT email UNIQUE (email), 
	CONSTRAINT fk_user_role FOREIGN KEY(role_id) REFERENCES roles (id), 
	CONSTRAINT fk_users_clubs FOREIGN KEY(id_clubs) REFERENCES clubs (id_clubs) ON DELETE SET NULL ON UPDATE CASCADE
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
	image VARCHAR(500) NOT NULL DEFAULT '', 
	is_active BOOL NOT NULL DEFAULT 1, 
	is_external BOOL NOT NULL DEFAULT 0, 
	status VARCHAR(50) NOT NULL, 
	city VARCHAR(120) NOT NULL DEFAULT '', 
	location VARCHAR(255) NOT NULL DEFAULT '', 
	user_id INTEGER, 
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_event), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE newsletters (
	id_newsletter INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(255) NOT NULL, 
	subject VARCHAR(255) NOT NULL, 
	content TEXT NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	sent_at DATETIME, 
	user_id INTEGER, 
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id_newsletter), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE event_category (
	id_event INTEGER NOT NULL, 
	id_category INTEGER NOT NULL, 
	PRIMARY KEY (id_event, id_category), 
	FOREIGN KEY(id_event) REFERENCES event (id_event), 
	FOREIGN KEY(id_category) REFERENCES category (id_category)
);
