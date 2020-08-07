let pen = this.formatter;

this.echo(`
${pen.orange(`/*---------------------------------*
 * About Me
 *---------------------------------*/`)}
A 1993 Taurus ENTJ who loves coding, food and is addicted to ${pen.link(
	'Puzzle & Dragons',
	'http://puzzledragonx.com/'
)}.
Rollercoaster, horror movie and classical music lover.

${pen.orange(`/*---------------------------------*
 * What I Do
 *---------------------------------*/`)}
Eat, sleep, breath, work, browse.
Also maintain Puzzle & Dragons and other miscellaneous projects as hobbies.
Use <${pen.green('projects')}> to learn more.
You can also find my Github ${pen.link(
	'here',
	'https://github.com/afunworm'
)} (FYI, most of my repositories are private so there won't be much)
    
${pen.orange(`/*---------------------------------*
 * Get In Touch
 *---------------------------------*/`)}
Totally not shy as I may appear to be, so hit me up, for anything. Literally. Anything.
${pen.em('Discord')}: afunworm#9157 - ${pen.em('P&D ID')}: 389,299,360
Or use <${pen.green('chat')}> or <${pen.green('contact')}>
`);
