"use strict";
var fs = require('fs');
var path = require('path');
var async = require('async');
var marked = require('marked');
var hljs = require('highlight.js');
var nunjucks = require('nunjucks');
var unidecode = require('unidecode');

var FILE_ENCODING = 'utf-8';

var dependencies = {};
var verbose;
var fileTools;

marked.setOptions({
	gfm: true,
	tables: true,
	breaks: true,
	smartypants: true,
	highlight: function (code, lang) {
		if(lang) {
			return hljs.highlight(lang, code).value;
		} else {
			return "<code>" + code + "</code>";
		}
	}
});

var getGoodName = function(filename) {
	var name = path.basename(filename, ".md");
	return unidecode(name)
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]+/gi,'')
		.toLowerCase();
};

var Dome = function(fuller, plan) {
	if(!verbose) {
		verbose = fuller.verbose;
	}

	if(!fileTools) {
		fileTools = fuller.getTool('files');
	}

	this.dst = plan.defaults.dst;
	this.home = plan.defaults.home;
	this.title = plan.defaults.title;

	this.tasks = this.getFullTasks(plan.tasks);

	this.defaultTemplate = plan.defaults.defaultTemplate;
	this.templatesPath = path.join(fuller.pathes.home, plan.defaults.templates);
	this.env = new nunjucks.Environment(new nunjucks.FileSystemLoader(this.templatesPath));
};

Dome.prototype.buildDependencies = function() {
	var dir;

	for(dir in this.tasks) {
		var task = this.tasks[dir];
		fileTools.addDependence(dependencies, path.join(this.templatesPath, (task.template || this.defaultTemplate)), dir);
		fileTools.addDependence(dependencies, task.content, dir);
	}
};

Dome.prototype.buildOneTask = function(dst, options, cbEach) {
	var self = this;
	return function(cb) {
			verbose.log("Building".green, dst);
			self.buildOne(
				dst,
				options,
				function(err, dst) {
					cb(err, dst);
					cbEach && cbEach(err, dst);
				}
			);
	};
};

Dome.prototype.buildOne = function(dst, options, cb) {
	var self = this;
	var template = this.env.getTemplate(options.template || this.defaultTemplate);
	var contentPath = options.content;
	var title = this.title + (options.title || path.basename(contentPath, ".md") || '');

	async.waterfall([
		function(cb) {
			fs.readFile(contentPath, {encoding: FILE_ENCODING}, cb);
		},

		function(data, cb) {
			marked(data, cb);
		},

		function(html, cb) {
			template.render({
				home: self.home,
				path: dst,
				title: title,
				content: html
			}, cb);
		},

		function(html, cb) {
			var dstFile = path.join(self.dst, dst, 'index.html');
			fileTools.writeForce(dstFile, html, cb);
		}
	], cb);
};

Dome.prototype.getFullTasks = function(tasks) {
	var newTasks = {}, dir;

	for(dir in tasks) {
		var task = tasks[dir];
		task.content = path.normalize(path.join(this.dst, task.content));

		if(fs.lstatSync(task.content).isDirectory()) {
			var files = fs.readdirSync(task.content);

			for(var f in files) {
				var newTask = {
					template: task.template,
					content: path.join(task.content, files[f])
				};

				var name = getGoodName(newTask.content);
				newTask.title = task.title + name;
				var newDir = dir + name;

				newTasks[newDir] = newTask;
			}
		} else {
			newTasks[dir] = task;
		}
	}

	return newTasks;
};

Dome.prototype.build = function(cbEach, cbDone) {
	var queue = {}, dir;

	for(dir in this.tasks) {
		var task = this.tasks[dir];
		queue[dir] = this.buildOneTask(dir, task, cbEach);
	}

	async.series(queue, function(err, result) {
		cbDone && cbDone(err, result);
	});
};

Dome.prototype.watch = function(cb) {
	var self = this;

	this.buildDependencies();
	fileTools.watchFiles( null, dependencies, function(filename) {
		var f, filesToBuild = dependencies[filename];
		var queue = {};

		verbose.log("Changed ".red, filename);

		for(f in filesToBuild) {
			queue[f] = self.buildOneTask(filesToBuild[f], self.tasks[filesToBuild[f]]);
		}

		async.series(queue, cb);

	});
};


module.exports = Dome;
