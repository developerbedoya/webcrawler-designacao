BEGIN TRANSACTION;
CREATE TABLE `usuario` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`email`	TEXT NOT NULL
);
CREATE TABLE `filtro` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`idUsuario`	INTEGER NOT NULL,
	`regional`	TEXT NOT NULL,
	`municipio`	TEXT NOT NULL,
	`cargo`	TEXT NOT NULL,
	`categoria`	TEXT,
	FOREIGN KEY(`idUsuario`) REFERENCES usuario(id)
);
CREATE TABLE "envio" (
	`idUsuario`	INTEGER NOT NULL,
	`idDesignacao`	TEXT NOT NULL,
	`enviado`	INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY(`idUsuario`) REFERENCES usuario ( id ),
	FOREIGN KEY(`idDesignacao`) REFERENCES designacao ( id )
);
CREATE TABLE `designacao` (
	`id`	TEXT NOT NULL,
	`url`	TEXT NOT NULL,
	`conteudo`	TEXT NOT NULL,
	PRIMARY KEY(id)
);
CREATE TABLE `configEmail` (
	`nome`	TEXT NOT NULL,
	`tipoServico`	TEXT NOT NULL,
	`email`	TEXT NOT NULL,
	`login`	TEXT NOT NULL,
	`senha`	TEXT NOT NULL
);
COMMIT;
