-- romi_access

CREATE TABLE `romi_comments` (
    `cid` int(10) UNSIGNED NOT NULL,
    `pid` int(10) UNSIGNED NOT NULL,
    `uid` int(10) UNSIGNED NOT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `ip` varchar(64) NOT NULL,
    `ua` varchar(511) NOT NULL,
    `text` text NOT NULL
);

CREATE TABLE `romi_users` (
    `uid` int(10) UNSIGNED NOT NULL,
    `username` varchar(32) NOT NULL,
    `password` varchar(256) NOT NULL,
    `salt` varchar(32) NOT NULL,
    `email` varchar(128) NOT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `lastLogin` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `isAdmin` char(1) NOT NULL DEFAULT '0',
    `isDeleted` char(1) NOT NULL DEFAULT '0',
    `url` varchar(128) DEFAULT NULL
);

CREATE TABLE `romi_posts` (
    `pid` int(10) UNSIGNED NOT NULL,
    `title` varchar(150) NOT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `modified` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `text` text NOT NULL,
    `password` varchar(32) NOT NULL DEFAULT NULL,
    `hide` char(1) NOT NULL DEFAULT '0',
    `allowComment` char(1) NOT NULL DEFAULT '1',
    `views` int(10) NOT NULL DEFAULT '0',
    `likes` int(10) NOT NULL DEFAULT '0',
    `comments` int(10) NOT NULL DEFAULT '0',
    `banner` text DEFAULT NULL
);

CREATE TABLE `romi_metas` (
    `mid` int(10) UNSIGNED NOT NULL,
    `name` varchar(32) NOT NULL,
    `isCategory` char(1) NOT NULL DEFAULT '0'
);

CREATE TABLE `romi_relationships` (
    `pid` int(10) UNSIGNED NOT NULL,
    `mid` int(10) UNSIGNED NOT NULL
);

CREATE TABLE `romi_fields` (
    `fid` int(10) UNSIGNED NOT NULL,
    `key` varchar(32) NOT NULL,
    `value` text NOT NULL,
    `isPublic` char(1) NOT NULL DEFAULT '0'
)

CREATE TABLE `romi_news_comments` (
    `cid` int(10) UNSIGNED NOT NULL,
    `nid` int(10) UNSIGNED NOT NULL,
    `uid` int(10) UNSIGNED NOT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `ip` varchar(64) NOT NULL,
    `ua` varchar(511) NOT NULL,
    `text` text NOT NULL
);

CREATE TABLE `romi_news` (
    `nid` int(10) UNSIGNED NOT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `modified` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `text` text NOT NULL,
    `hide` char(1) NOT NULL DEFAULT '0',
    `views` int(10) NOT NULL DEFAULT '0',
    `likes` int(10) NOT NULL DEFAULT '0',
    `comments` int(10) NOT NULL DEFAULT '0',
    `imgs` text DEFAULT NULL
);

CREATE TABLE `romi_seimgs` (
    `id` int(10) UNSIGNED NOT NULL,
    `pixivPid` int(10) UNSIGNED NOT NULL,
    `pixivUid` int(10) UNSIGNED NOT NULL,
    `title` varchar(150) NOT NULL,
    `author` varchar(150) NOT NULL,
    `r18` char(1) NOT NULL DEFAULT '0',
    `tags` text DEFAULT NULL,
    `width` int(10) UNSIGNED NOT NULL,
    `height` int(10) UNSIGNED NOT NULL,
    `type` varchar(10) NOT NULL,
    `url` text NOT NULL
);

CREATE TABLE `romi_hitokotos` (
    `id` int(10) UNSIGNED NOT NULL,
    `msg` text NOT NULL,
    `from` varchar(150) NOT NULL,
    `type` varchar(10) NOT NULL,
    `likes` int(10) NOT NULL DEFAULT '0',
    `isPublic` char(1) NOT NULL DEFAULT '0'
)

CREATE TABLE `romi_characters` (
    `id` int(10) UNSIGNED NOT NULL,
    `name` varchar(191) NOT NULL,
    `romaji` varchar(191) NOT NULL,
    `gender` VARCHAR(20) NOT NULL,
    `alias` text DEFAULT NULL,
    `age` int(10) UNSIGNED DEFAULT NULL,
    `images` text NOT NULL,
    `url` text DEFAULT NULL,
    `description` text NOT NULL,
    `comment` text DEFAULT NULL,
    `hitokoto` text DEFAULT NULL,
    `birthday` int(10) UNSIGNED DEFAULT NULL,
    `voice` varchar(191) DEFAULT NULL,
    `series` text NOT NULL,
    `seriesGenre` varchar(20) NOT NULL,
    `tags` text DEFAULT NULL,
    `hairColor` varchar(191) DEFAULT NULL,
    `eyeColor` varchar(191) DEFAULT NULL,
    `bloodType` VARCHAR(3) DEFAULT NULL,
    `height` int(10) UNSIGNED DEFAULT NULL,
    `bust` int(10) UNSIGNED DEFAULT NULL,
    `waist` int(10) UNSIGNED DEFAULT NULL,
    `hip` int(10) UNSIGNED DEFAULT NULL,
    `created` int(10) UNSIGNED NOT NULL DEFAULT '0',
    `color` varchar(191) DEFAULT NULL,
    `hide` char(1) NOT NULL DEFAULT '0',
    `order` int(10) UNSIGNED NOT NULL DEFAULT '50',
    `songId` int(10) UNSIGNED DEFAULT NULL,
    `weight` int(10) UNSIGNED DEFAULT NULL
);

ALTER TABLE `romi_comments`
ADD PRIMARY KEY (`cid`),
ADD KEY `pid` (`pid`),
ADD KEY `uid` (`uid`);

ALTER TABLE `romi_users`
ADD PRIMARY KEY (`uid`),
ADD UNIQUE KEY `username` (`username`),
ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `romi_posts`
ADD PRIMARY KEY (`pid`),
ADD KEY `created` (`created`);

ALTER TABLE `romi_metas` ADD PRIMARY KEY (`mid`);

ALTER TABLE `romi_relationships` ADD PRIMARY KEY (`pid`, `mid`);

ALTER TABLE `romi_fields` ADD PRIMARY KEY (`fid`);

ALTER TABLE `romi_news_comments`
ADD PRIMARY KEY (`cid`),
ADD KEY `nid` (`nid`),
ADD KEY `uid` (`uid`);

ALTER TABLE `romi_news`
ADD PRIMARY KEY (`nid`),
ADD KEY `created` (`created`);

ALTER TABLE `romi_seimgs`
ADD PRIMARY KEY (`id`),
ADD KEY `pixivPid` (`pixivPid`),
ADD KEY `pixivUid` (`pixivUid`);

ALTER TABLE `romi_hitokotos` ADD PRIMARY KEY (`id`);

ALTER TABLE `romi_characters` ADD PRIMARY KEY (`id`);

ALTER TABLE `romi_comments`
MODIFY `cid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_users`
MODIFY `uid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_posts`
MODIFY `pid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_metas`
MODIFY `mid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

-- ALTER TABLE `romi_relationships`
-- MODIFY `pid` int(10) UNSIGNED NOT NULL,

ALTER TABLE `romi_fields`
MODIFY `fid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_news_comments`
MODIFY `cid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_news`
MODIFY `nid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_seimgs`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_hitokotos`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `romi_characters`
MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;