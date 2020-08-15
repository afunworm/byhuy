let pen = this.formatter;

this.echo(
	`Available commands are <${pen.green('help')}> <${pen.orange('ai')}(experimental)> <${pen.green(
		'clear'
	)}> <${pen.green('reload')}> <${pen.green('about')}> <${pen.green('projects')}> <${pen.green('chat')}> <${pen.green(
		'contact'
	)}>\n`
);
