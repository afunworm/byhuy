let pen = this.formatter;

this.echo(
	`You are now under the ${pen.em('projects')} section. Use <${pen.green(
		'help'
	)}> to see available commands under this section. Use <${pen.green('exit')}> to return to the previous menu.\n`
);

this.set_prompt('/projects');

this.push(async (command) => {
	if (!command) return;

	let cmd = $.terminal.split_command(command);
	command = cmd.name;
	let projectName = cmd.args[0];

	if (command === 'help') {
		this.echo(
			`Available commands are <${pen.green('help')}> <${pen.green('clear')}> <${pen.green(
				'reload'
			)}> <${pen.green('exit')}> <${pen.green('chalistt')}> <${pen.green('about project_name')}> <${pen.green(
				'view project_name'
			)}>\n`
		);
	} else if (command === 'list') {
		this.echo(
			`Available project names: ${pen.em('(pad)Puzzle & Dragons Card Maker')},  ${pen.em(
				'(xcel)XCEL Digital'
			)}, ${pen.em('(starbuzz)Starbuzz')}, ${pen.em('(blog)Personal Blog')}\n`
		);
	} else if (command === 'view') {
		if (!projectName) {
			this.error(
				`Invalid Syntax. The <about project_name'> command must have the name of the project as first argument\nFor a list of available project names, use <list>\n`
			);
			return;
		}

		if (projectName === 'pad') {
			this.echo(`Opening ${pen.link('Puzzle & Dragons Card Maker', 'https://pad.byh.uy/')} in a new window...\n`);
			window.open('https://pad.byh.uy/');
		} else if (projectName === 'xcel') {
			this.echo(`Opening ${pen.link('XCEL Digital', 'https://xcel.digital/')} in a new window...\n`);
			window.open('https://xcel.digital/');
		} else if (projectName === 'starbuzz') {
			this.error('Sorry. Public access is not yet allowed for Starbuzz\n');
		} else if (projectName === 'blog') {
			this.echo(`Opening ${pen.link('my blog', 'https://inthecornerofmymind.com/')} in a new window...\n`);
			window.open('https://inthecornerofmymind.com/');
		} else {
			this.error(`Project ${projectName} does not exist\n`);
		}
	} else if (command === 'about') {
		if (!projectName) {
			this.error(
				'Invalid Syntax. The <about project_name> command must have the name of the project as first argument\nFor a list of available project names, use <list>\n'
			);
			return;
		}

		//The start spinner won't work
		this.untilTerminalReady(async () => {
			this.startSpinner();

			try {
				if (['pad', 'xcel', 'starbuzz', 'blog'].includes(projectName)) {
					let commandService = this.getCommandService();
					let script = await commandService.execute(`projects.${projectName}`);
					new Function(script).call(this);
				} else {
					this.error(`Project ${projectName} does not exist]\n`);
				}
				this.stopSpinner();
			} catch (error) {
				this.error(`${error}\n`);
				this.stopSpinner();
			}
		});
	} else if (command === 'exit') {
		this.echo(
			`You have exited the ${pen.em('projects')} section and are back to the home section. Use <${pen.green(
				'help'
			)}> to see available commands.\n`
		);
		this.pop();
		this.set_prompt();
	} else {
		this.error(`Unknown command ${command}\n`);
	}
});
