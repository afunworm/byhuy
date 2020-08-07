this.initUserSession(this.getCurrentUserName(), true).then(async (user) => {
	try {
		let userId = user.uid;
		let roomId = user.uid;
		let userName = this.getCurrentUserName();
		let chatService = this.getChatService();
		let pen = this.formatter;

		this.echo(`\nInitiating session ${pen.em(userId)}...`);
		chatService.init(roomId);

		//Restart the spinner because it might have been stopped
		this.startSpinner();

		//Ask if user wants to load previous messages or not
		this.stopSpinner();
		let loadHistory = await chatService.loadHistoryConfirm(this);
		this.startSpinner();

		//Add user to room
		this.echo(''); //Line break
		this.echo(pen.info('i', 'chat', `Executing ${pen.em('user session')} script.`, 'lightblue'));
		await chatService.addUser(userId, userName);

		//Setting up member & chat listener
		this.echo(pen.info('i', 'chat', `Setting up ${pen.em('member listener')} service.`, 'green'));
		await chatService.setUpMemberListener(this);
		this.echo(pen.info('i', 'chat', `Setting up ${pen.em('chat listener')} service.`, 'lightblue'));
		await chatService.setUpChatListener(this, loadHistory);

		//Notify Huy
		this.echo(pen.info('i', 'chat', `Notifying Huy of incoming chat request.`, 'green'));
		await this.notifyIncomingChatRequest();

		this.echo(pen.info('ok', 'chat', `Chat session initialized.`, 'lightblue'));

		this.echo(
			pen.em(
				`\nInitialization completed. Huy has been notified about your live chat request.\nYou will be notified once Huy has joined the chat.You can use a new window to continue using the website.\n`
			)
		);
	} catch (error) {
		this.error('Unable to initiate chat request.');
		this.error(`${error}\n`);
		this.stopSpinner();
	}
});
