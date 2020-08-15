this.initUserSession(this.getCurrentUserName(), true).then(async (user) => {
	try {
		let userId = user.uid;
		let userName = this.getCurrentUserName();
		let ai = this.getAIService();
		let pen = this.formatter;

		//Restart the spinner because it might have been stopped
		this.startSpinner();

		this.echo(`\nInitiating AI session with id ${pen.em(userId)}...`);
		ai.init(this, userId);

		//Add user
		this.echo(''); //Line break
		this.echo(pen.info('i', 'AI', `Executing ${pen.em('user-to-AI registration')} script.`, 'lightblue'));
		ai.addUser(userId, userName);

		//Allowing chat
		this.echo(pen.info('i', 'AI', `Loading ${pen.em('AI Chat')} module.`, 'green'));
		ai.startChat();
		this.echo(pen.info('ok', 'AI', `AI Chat session initialized.`, 'lightblue'));

		this.echo(pen.em(`\nInitialization completed. Huy's AI is ready to talk to you! Say hi!.\n`));
		this.stopSpinner();
	} catch (error) {
		this.error('Unable to initiate chat request.');
		this.error(`${error}\n`);
		this.stopSpinner();
	}
});
