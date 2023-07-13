/** @typedef {import('../lib').NS} NS */

// Argument class
export class KeywordArgument {
    /** 
     * Keyword Argument
     * @param {string[]} keywords
     * @param {string} argName
     * @param {string} description
     * @param {boolean} required
     * @param {boolean} pair
    */
    constructor(
        keywords,
        argName,
        description,
        required = false,
        pair = false,
    ) {
        this.keywords = keywords;
        this.argName = argName;
        this.description = description;
        this.required = required;
        this.pair = pair;
    }
}

// Flags for the KeywordArgument
export const KEYWORD_FLAGS = {
    REQUIRED: true,
    NOT_REQUIRED: false,
    PAIR: true,
    NO_PAIR: false,
};

// Arguments object
export class Arguments {
    // Help keyword
    help = new KeywordArgument(
        ['-?', '--help'],
        'help',
        'Displays the command usage.',
        false,
        false,
    );

    /** 
     * Arguments object
     * @param {NS} ns
     * @param {KeywordArgument[]} keywordsList
    */
    constructor(ns, keywordsList) {
        this.valid = true;
        this.args = [];
        this.baseArgs = ns.args;
        this.keywordsList = [this.help, ...keywordsList]
        this.tprintf = ns.tprintf;

        // Run checks
        this.getArgs();
        this.hasTheRequiredArgs();
    }

    /** 
     * Get the arguments
     * @returns {void}
    */
    getArgs() {
        // Extract the arguments
        for (let i = 0; this.valid && i < this.baseArgs.length; i++) {
            const foundArg = this.keywordsList.find((argument) => {
                return argument.keywords.includes(this.baseArgs[i]);
            });

            // Check if the argument is valid
            if (foundArg === undefined) {
                this.valid = false;
                this.tprintf(`Invalid argument: ${this.baseArgs[i]} Use -? for help.`);
                break;
            }

            // Check if the argument is help
            if (this.help.keywords[0] === foundArg.keywords[0]) {
                this.valid = false;
                this.printUsage('Command usage:\n');
                break;
            }

            // Check if the argument is a pair
            if (foundArg.pair) {
                if (this.baseArgs[i + 1] === null || this.baseArgs[i + 1] === undefined) {
                    this.tprintf(`Missing value for argument ${this.baseArgs[i]} Use -? for help.`);
                    this.valid = false;
                }
                this.args[foundArg.argName] = this.baseArgs[i + 1];
                i++;
            } else {
                this.args[foundArg.argName] = true;
            }
        }
    }

    /** 
     * Check if it has the required arguments
     * @returns {boolean}
    */
    hasTheRequiredArgs() {
        if (this.valid) {
            const requiredArgs = this.keywordsList.filter((argument) => {
                return argument.required === true;
            });

            let missingRequiredArgs = [];

            requiredArgs.forEach((requiredArg) => {
                if (this.baseArgs.find((arg) => requiredArg.keywords.includes(arg)) === undefined) {
                    this.valid = false;
                    missingRequiredArgs.push(requiredArg.keywords[0]);
                }
            });
            
            if (missingRequiredArgs.length > 0) {
                this.tprintf(`Missing required arguments: ${missingRequiredArgs.join(', ')}`);
            }
        }
    }

    /**
     * Print the usage
     * @param {string} reason
     * @param {KeywordArgument[]} argList
     * @returns {void}
    */
    printUsage(reason) {
        this.tprintf(reason);
        // Print the usage
        this.keywordsList.forEach((argument) => {
            const keywords = argument.keywords.join(', ');
            const pairString = argument.pair ?  ` = VALUE` : '';
            this.tprintf(`    ${keywords}${pairString}\n\t${argument.description}\n`);
        });
    }
}