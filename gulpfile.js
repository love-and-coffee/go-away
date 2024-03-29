"use strict";

const gulp = require("gulp");

// Bootstrap individual task files
["build", "css", "template", "watch", "zip"].forEach((task) => require(`./tasks/${task}`)());

gulp.task("default", gulp.series("build", "css", "template", "zip", "report"));
