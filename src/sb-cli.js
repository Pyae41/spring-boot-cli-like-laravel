
import { Command } from "commander";
import {
  captializeFirstLetter,
  checkMvnOrGradle,
  generateAsciiSpringBootCLIText,
  generateBoxedText,
  generateControllerFile,
  generateModelFile,
  generateRepoFile,
  generateSeederFile,
  generateServiceFile,
  generateSpringBootProject,
  getMainJavaPackageAsPath,
  isSpringbootProject,
  scanModelDirectory
} from "./utils/helper.js";
import chalk from "chalk";
import inquier from 'inquirer';
import { execFileSync } from "child_process";
import { springBootsDependencies } from "./utils/fileContents.js";

const program = new Command();

const aciiArt = generateAsciiSpringBootCLIText();

const boxedText = generateBoxedText("1.1.0");

const helpOutputInsideSpring = `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb [command] [options]')}

  Options:
    -v, --version                          Display the current version
    -h, --help                             Display help for command

  Commands:
    serve                                  Run application
    make:model <name> [options]            To create model file.
    make:repository <name>                 To create repository file.
    make:service <name>                    To create services file.
    make:controller <name> [options]       To create controller file.
    make:seeder <name> [options]           To create seeder file.
    make:pivot <model1> model2>            To create pivot file.
    db:seed                                Seeding seeder files
    [command] -h, --help                   Display help for command\n
`;
const helpOutputOutsideSpring = `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb [command] [options]')}

  Options:
    -v, --version                          Display the current version
    -h, --help                             Display help for command

  Commands:
    init                                   Create Spring Boot Project
    [command] -h, --help                   Display help for command\n
`;

const globalCommand = program
  .name("sb")
  .description("CLI like laravel for spring boot")
  .version(boxedText, '-v, --version', 'output the current version');

globalCommand.helpInformation = () => {
  return isSpringbootProject() ? helpOutputInsideSpring : helpOutputOutsideSpring;
}


// make model command
const makeModelCommand = program
  .command("make:model <name>")
  .description("To create model file.")
  .option("-c, --controller", " Generate a controller file for model")
  .option("-repo, --repository", "Generate a repository file for model")
  .option("-srv, --service", "Generate a service file for model")
  .option("-s, --seeder", "Generate a seeder file for model")
  .option("-r, --resource", "Generate all files require for API")
  .action((name, options) => {
    getMainJavaPackageAsPath();
    if (isSpringbootProject()) {
      const captilized = captializeFirstLetter(name.toLowerCase());

      generateModelFile(captilized);

      if (options.controller) {
        generateControllerFile(captilized);
      }

      if (options.repository) {
        generateRepoFile(captilized);
      }

      if (options.service) {
        generateServiceFile(captilized);
      }
      if (options.seeder) {
        generateSeederFile(captilized);
      }

      if (options.resource) {
        generateRepoFile(captilized);
        generateServiceFile(captilized);
        generateControllerFile(captilized, "rest", "resource");
      }
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  })
makeModelCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}

  ${chalk.magenta.bold('Usage: sb make:model <name> [options]')}

  To create model file.

  Options:
    -c, --controller         Generate a controller file for model
    -repo, --repository      Generate a repository file for model
    -srv, --service          Generate a service file for model
    -s, --seeder             Generate a seeder file for model
    -r, --resource           Generate all files require for API
    -h, --help               Display help for command\n
`
};

// controller command
const makeController = program
  .command("make:controller <name>")
  .description("To create controller file.")
  .option("-c, --controller", "Generate a controller")
  .option("-r, --resource", "Generate a rest controller file with CRUD and fetching methods")
  .action((name, options) => {
    if (isSpringbootProject()) {
      const captilized = captializeFirstLetter(name.toLowerCase());
      if (options.controller) {
        generateControllerFile(captilized, "controller");
      }
      else if (options.resource) {
        generateControllerFile(captilized, "rest", "resource");
      }
      else generateControllerFile(captilized);
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });

makeController.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb make:controller <name> [options]')}

  To create controller file.

  Options:
    -c, --controller         Generate a rest controller file with CRUD and fetching methods
    -r, --resource           Generate a rest controller file with CRUD and fetching methods
    -h, --help               Display help for command\n
`;
}

// service command
const makeServiceCommand = program
  .command("make:service <name>")
  .description("To create service file.")
  .action((name) => {
    if (isSpringbootProject()) {
      const captilized = captializeFirstLetter(name.toLowerCase());
      const checkModelExist = scanModelDirectory();

      if (!checkModelExist.includes(name)) console.log(`${chalk.yellow.bold("⚠")} Make sure you created ${name} model.`)
      else generateServiceFile(captilized);
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
makeServiceCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb make:service <name>')}
  
  To create service file.

  Options:
    -h, --help      Display help for command\n
`;
}

// repository command
const makeRepoCommand = program
  .command("make:repository <name>")
  .description("To create repository file.")
  .action((name) => {
    if (isSpringbootProject()) {
      const captilized = captializeFirstLetter(name.toLowerCase());
      const checkModelExist = scanModelDirectory();

      if (!checkModelExist.includes(name)) console.log(`${chalk.yellow.bold("⚠")} Make sure you created ${name} model.`)
      else generateRepoFile(captilized);
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
makeRepoCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb make:repository <name>')}

  To create repository file.

  Options:
    -h, --help      Display help for command\n
`;
}


// seeder command
const makeSeederCommand = program
  .command("make:seeder <name>")
  .description("To create seeder file.")
  .action((name) => {
    if (isSpringbootProject()) {
      const captilized = captializeFirstLetter(name.toLowerCase());
      const checkModelExist = scanModelDirectory();

      if (!checkModelExist.includes(name)) console.log(`${chalk.yellow.bold("⚠")} Make sure you created ${name} model.`)
      else generateSeederFile(captilized);

    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
makeSeederCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb make:seeder <name>')}

  To create seeder file.

  Options:
    -h, --help      Display help for command\n
`;
}

// pivot command
const makePivotCommand = program
  .command("make:pivot <models...>")
  .description("To create seeder file.")
  .option("-s, --seeder", "Generate a seeder file for pivot")
  .action((models, options) => {
    if (isSpringbootProject()) {
      let pivotName = "";
      const existModel = scanModelDirectory();

      const checkModelExist = models.filter((model) => {
        return existModel.includes(model.toLowerCase());
      });

      if (checkModelExist.length > 1) {
        models.map((model) => {
          pivotName += captializeFirstLetter(model.toLowerCase());
        });

        if (options.seeder) {
          generateSeederFile(pivotName);
        }

        generateModelFile(pivotName);
      }
      else if (checkModelExist.length == 1) {
        console.log(`${chalk.yellow.bold("⚠")} Missing one model to create pivot.`);
      }
      else {
        console.log(`${chalk.red.bold("⚠")} The models you try to create pivot do not exist in the project.`);
      }
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
makePivotCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb make:pivot <model1> <model2>')}

  To create pivot file.

  Options:
    -s, --seeder    Generate a seeder file for pivot
    -h, --help      Display help for command\n
`;
}

// run seeder
const runSeederCommand = program
  .command("db:seed")
  .description("To create seeder file.")
  .option("--seeder <name>", "Run a specific seeder")
  .action((options) => {
    if (isSpringbootProject()) {
      const mvnOrGradle = checkMvnOrGradle();
      const baseCommand = mvnOrGradle == 'mvn' ? 'mvn' : (process.platform == 'win32') ? 'gradlew.bat' : './gradlew';
      const baseArgs = baseCommand == 'mvn' ? ['spring-boot:run'] : ['bootRun'];

      if (options.seeder) {
        const seedCommand = mvnOrGradle == 'mvn' ? `-D spring-boot.run.arguments=\"--seeder=${options.seeder}\"` : `--args=\"--seeder=${options.seeder}\"`
        baseArgs.push(seedCommand);
      }
      else {
        const seedCommand = mvnOrGradle == 'mvn' ? `-D spring-boot.run.arguments=\"--seeder=all\"` : `--args=\"--seeder=all\"`
        baseArgs.push(seedCommand);
      }

      try {
        serveProcess = execFileSync(baseCommand, baseArgs, { stdio: 'inherit' });

        serveProcess.stdout.on('data', (data) => {
          console.log(data.toString());
        });
      } catch (err) { }
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
runSeederCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb db:seed')}

  To create pivot file.

  Options:
    --seeder=<name>    Run a specific seeder
    -h, --help         Display help for command\n
`;
}


// service command
const serveCommand = program
  .command("serve")
  .description("Run Application")
  .option('--port <name>', 'Server Port')
  .action((options) => {
    if (isSpringbootProject()) {
      const mvnOrGradle = checkMvnOrGradle();
      const baseCommand = mvnOrGradle == 'mvn' ? 'mvn' : (process.platform == 'win32') ? 'gradlew.bat' : './gradlew';
      const baseArgs = baseCommand == 'mvn' ? ['spring-boot:run'] : ['bootRun'];

      if (options.port) {
        const portCommand = mvnOrGradle == 'mvn' ? `-D spring-boot.run.arguments=\"--server.port=${options.port}\"` : `--args=\"--server.port=${options.port}\"`
        baseArgs.push(portCommand);
      }

      try {
        serveProcess = execFileSync(baseCommand, baseArgs, { stdio: 'inherit' });

        serveProcess.stdout.on('data', (data) => {
          console.log(data.toString());
        });
      } catch (err) { }
    }
    else{
      console.log(`${chalk.yellow.bold('⚠')}  Make sure you are in spring boot project.`);
    }
  });
serveCommand.helpInformation = () => {
  return `${aciiArt}${boxedText}
  
  ${chalk.magenta.bold('Usage: sb serve [options]')}

  Run Application

  Options:
    --port=<port>       Server Port
    -h, --help          Display help for command\n
`;
}

// init spring boot project command
const initSpringBoot = program
  .command('init')
  .description("Create Spring Boot Project")
  .action(() => {
    inquier.prompt([
      {
        type: 'input',
        name: 'group',
        message: 'Enter the group ID (e.g., com.example):',
        default: 'com.example',
        validate: (input) => {
          const regex = /^[a-zA-Z]+(\.[a-zA-Z]+)+$/;
          return regex.test(input) || "Please enter a valid group ID like example"
        }
      },
      {
        type: 'input',
        name: 'artifact',
        message: 'Enter the artifact ID (e.g., demo):',
        default: 'demo',
        validate: (input) => {
          const regex = /^[a-zA-Z]+$/;
          return regex.test(input) || "Please enter a valid artifactId like example"
        }
      },
      {
        type: 'input',
        name: 'projectName',
        message: 'Enter the name of the Spring Boot project:',
        default: 'my-spring-boot-project'
      },
      {
        type: 'checkbox',
        name: 'selectedDeps',
        message: 'Select the dependencies you want to add:',
        choices: springBootsDependencies,
        validate: (select) => select.length > 0 || 'You need to select at least one dependency.'
      },
      {
        type: 'list',
        name: 'buildTool',
        message: 'Select the build tool:',
        choices: ['maven', 'gradle'],
        default: 'maven'
      },
      {
        type: 'list',
        name: 'javaVersion',
        message: 'Select the Java version:',
        choices: ['23', '21', '17'],
        default: '17'
      }
    ]).then(({ group, artifact, projectName, selectedDeps, buildTool, javaVersion }) => {
      generateSpringBootProject(group, artifact, projectName,selectedDeps, buildTool, javaVersion);
    });
  });


process.on('SIGINT', () => {
  if (serveProcess) {
    serveProcess.kill('SIGTERM'); // Gracefully terminate the Maven or gradle process
    process.exit(); // Exit the Node.js process after stopping Maven
  }
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(process.argv)
  program.outputHelp();
}
