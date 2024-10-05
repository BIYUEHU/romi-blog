-- romi_access

CREATE TABLE `romi_comments` (
    `cid` int(10) UNSIGNED NOT NULL,
    `aid` int(10) UNSIGNED NOT NULL,
    `uid` int(10) UNSIGNED NOT NULL,
    `created` int(10) UNSIGNED DEFAULT '0',
    `ip` varchar(64) NOT NULL,
    `text` text NOT NULL
);

CREATE TABLE `romi_users` (
    `uid` int(10) UNSIGNED NOT NULL,
    `username` varchar(32) NOT NULL,
    `password` varchar(256) NOT NULL,
    `salt` varchar(32) NOT NULL,
    `email` varchar(128) NOT NULL,
    `created` int(10) UNSIGNED DEFAULT '0',
    `lastLogin` int(10) UNSIGNED DEFAULT '0',
    `isAdmin` char(1) DEFAULT '0',
    `isDeleted` char(1) DEFAULT '0',
    `url` varchar(128) DEFAULT NULL
);

CREATE TABLE `romi_articles` (
    `aid` int(10) UNSIGNED NOT NULL,
    `title` varchar(150) NOT NULL,
    `created` int(10) UNSIGNED DEFAULT '0',
    `modified` int(10) UNSIGNED DEFAULT '0',
    `text` longtext NOT NULL,
    `password` varchar(32) DEFAULT NULL,
    `hide` char(1) DEFAULT '0',
    `allowComment` char(1) DEFAULT '1',
    `views` int(10) DEFAULT '0',
    `likes` int(10) DEFAULT '0',
    `comments` int(10) DEFAULT '0'
);

CREATE TABLE `romi_metas` (
    `mid` int(10) UNSIGNED NOT NULL,
    `name` varchar(32) NOT NULL,
    `count` varchar(10) DEFAULT '0',
    `isCategory` char(1) DEFAULT '0'
);

CREATE TABLE `romi_relationships` (
    `aid` int(10) UNSIGNED NOT NULL,
    `mid` int(10) UNSIGNED NOT NULL
);

ALTER TABLE `romi_comments`
ADD PRIMARY KEY (`cid`),
ADD KEY `aid` (`aid`),
ADD KEY `uid` (`uid`);

ALTER TABLE `romi_users`
ADD PRIMARY KEY (`uid`),
ADD UNIQUE KEY `username` (`username`),
ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `romi_articles`
ADD PRIMARY KEY (`aid`),
ADD KEY `created` (`created`);

ALTER TABLE `romi_metas` ADD PRIMARY KEY (`mid`);

ALTER TABLE `romi_relationships` ADD PRIMARY KEY (`aid`, `mid`);

ALTER TABLE `romi_comments`
MODIFY `cid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_users`
MODIFY `uid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_articles`
MODIFY `aid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_metas`
MODIFY `mid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;