import fs from "fs";
import fsExtra from "fs-extra";
import path from "path";
import chalk from 'chalk';
import figlet from "figlet";
import boxen from "boxen";
import prReader from "properties-reader";
import ymlReader from "js-yaml";
import AdmZip from "adm-zip";
import { execSync } from "child_process";
import {
    modelFileContent,
    controllerFileContent,
    seederFileContent,
    seederConfigFileContent,
    seederManagerFileContent,
    serviceFileContent,
    serviceImplFileContent,
    repoFileContent,
    globalCommandLineRunnerFileContent
} from "./fileContents.js";


export const checkMvnOrGradle = () => {
    const directory = process.cwd();

    // Check for Maven or Gradle files
    const pomPath = path.join(directory, 'pom.xml');

    if (fs.existsSync(pomPath)) {
        return "mvn";
    }
    else {
        return "gradle"
    }
}

export const isSpringbootProject = () => {

    const directory = process.cwd();

    // Check for Maven or Gradle files
    const pomPath = path.join(directory, 'pom.xml');
    const gradlePath = path.join(directory, 'build.gradle');
    const gradleKtsPath = path.join(directory, 'build.gradle.kts');

    // Check for src/main/java and src/main/resources directories
    const srcJavaPath = path.join(directory, 'src', 'main', 'java');
    const srcResourcesPath = path.join(directory, 'src', 'main', 'resources');

    if (fs.existsSync(pomPath) && (fs.existsSync(srcJavaPath) && fs.existsSync(srcResourcesPath))) {
        return true;
    } else if (fs.existsSync(gradlePath) || fs.existsSync(gradleKtsPath) && fs.existsSync(srcJavaPath) && fs.existsSync(srcResourcesPath)) {
        return true;
    } else {
        return false;
    }
}

export const getMainJavaPackageAsPath = () => {

    const javaSrcPath = path.join(process.cwd(), "src", "main", "java");

    if (!fs.existsSync(javaSrcPath)) {
        return;
    }

    // find java file
    const javaFiles = [];

    const findJavaFiles = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findJavaFiles(fullPath);
            }
            else if (file.endsWith('.java')) {
                javaFiles.push(fullPath);
            }

        });
    }

    findJavaFiles(javaSrcPath);
    // get main package 
    const mainPackages = new Set();
    javaFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const packageRegex = /package\s+([a-zA-Z0-9_.]+)\s*;/;
        const match = content.match(packageRegex);
        if (match && match[1]) {
            const fullPackage = match[1];

            let mainPackage = "";

            fullPackage.split('.').map((pack) => {
                mainPackage += pack + "/";
            });

            // remove last "/"
            mainPackage = mainPackage.slice(0, -1);

            mainPackages.add(mainPackage);
        }
    });

    // console.log(mainPackages);
    return mainPackages.values().next().value;
}
export const getMainJavaPackageAsClassPath = () => {
    return getMainJavaPackageAsPath().replaceAll("/", ".");
}

export const generateModelFile = (name) => {
    const classPath = getMainJavaPackageAsClassPath();
    const modelContent = modelFileContent(name, classPath);

    generateJavaFile(name, "model", modelContent);
}

export const generateRepoFile = (name) => {
    const classPath = getMainJavaPackageAsClassPath();
    const repoContent = repoFileContent(name, classPath);

    generateJavaFile(name, "repository", repoContent);
}

export const generateServiceFile = (name) => {
    const classPath = getMainJavaPackageAsClassPath();
    const serviceContent = serviceFileContent(name, classPath);
    const serviceImplContent = serviceImplFileContent(name, classPath);

    generateJavaFile(name, "service", serviceContent);
    generateJavaFile(name, "service/impl", serviceImplContent);
}

export const generateControllerFile = (name, mode = "rest", option = "default") => {
    const classPath = getMainJavaPackageAsClassPath();
    const controllerContent = controllerFileContent(name, classPath, mode, option);

    generateJavaFile(name, "controller", controllerContent);

}

export const generateSeederFile = (name) => {
    const classPath = getMainJavaPackageAsClassPath();
    const seederContent = seederFileContent(name, classPath);

    generateJavaFile(name, "seeder", seederContent);
}


export const captializeFirstLetter = (str) => {
    return str.replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
}

export const isPropertiesOrYML = () => {
    const resourcesPath = path.join(process.cwd(), "src", "main", "resources");
    const applicationPropertiesFilePath = path.join(resourcesPath, "application.properties");
    const applicationYMLFilePath = path.join(resourcesPath, "application.yml");

    let result = "";
    if (!fs.existsSync(resourcesPath)) {
        console.log(`${chalk.red.bold('⚠')} Resources folder not found.`)
        return;
    }
    if (fs.existsSync(applicationPropertiesFilePath)) {
        result = "properties";
    }
    else if (fs.existsSync(applicationYMLFilePath)) {
        result = "yml";
    }
    else {
        console.log(`${chalk.red.bold('⚠')} application.properties or .yml file not found.`);
        return;
    }

    return result;
}


export const scanModelDirectory = () => {
    const srcJavaPath = path.join(process.cwd(), "src", "main", "java");
    const modelPath = srcJavaPath + "/" + getMainJavaPackageAsPath() + "/model";
    const modelFiles = [];

    if (fs.existsSync(modelPath)) {
        const files = fs.readdirSync(modelPath);
        files.forEach((file) => {
            modelFiles.push(file.split(".")[0].toLowerCase());
        });
    }
    return modelFiles;
}

export const getPropertiesData = () => {
    const resourcesPath = path.join(process.cwd(), "src", "main", "resources");
    const applicationPropertiesFilePath = path.join(resourcesPath, "application.properties");

    if (fs.existsSync(applicationPropertiesFilePath)) {
        return prReader(applicationPropertiesFilePath);
    }

}
export const getYMLData = () => {
    const resourcesPath = path.join(process.cwd(), "src", "main", "resources");
    const applicationPropertiesFilePath = path.join(resourcesPath, "application.yml");

    if (fs.existsSync(applicationPropertiesFilePath)) {
        const fileContents = fs.readFileSync(applicationPropertiesFilePath, 'utf-8');
        return ymlReader.load(fileContents);
    }

}

export const generateAsciiSpringBootCLIText = () => {
    // Generate ASCII art for "Spring" and "Boot" and "CLI"
    const springArt = figlet.textSync('Spring', { horizontalLayout: 'default', font: 'Small' });
    const bootArt = figlet.textSync('Boot', { horizontalLayout: 'default', font: 'Small' });
    const cliArt = figlet.textSync('CLI', { horizontalLayout: 'default', font: 'Small' });

    // Split ASCII art into lines
    const springLines = springArt.split('\n');
    const bootLines = bootArt.split('\n');
    const cliLines = cliArt.split('\n');

    // Check arrays of lines have the same length
    const maxLength = Math.max(springLines.length, bootLines.length, cliLines.length);
    while (springLines.length < maxLength) springLines.push(' '.repeat(springLines[0].length));
    while (bootLines.length < maxLength) bootLines.push(' '.repeat(bootLines[0].length));
    while (cliLines.length < maxLength) cliLines.push(' '.repeat(cliLines[0].length));

    // Combine the two ASCII art line by line
    const combinedArt = springLines.map((line, i) => `${chalk.green(line)}  ${chalk.magenta(bootLines[i])} ${chalk.white(cliLines[i])}`).join('\n');

    // Output the combined ASCII art
    return "\n" + combinedArt + "\n";
}

export const generateBoxedText = (version) => {
    const textForBoxed = `\nCLI like ${chalk.red.bold("LARAVEL")} for ${chalk.green.bold("SPRING")} ${chalk.magenta.bold("BOOT")}\n`;
    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        borderStyle: 'classic',
        title: `version (${version})`,
        titleAlignment: 'center'
    };

    return boxen(textForBoxed, boxenOptions);
}

export const generateSpringBootProject = (group, artifact, projectName, selectedDeps, buildTool, javaVersion) => {
    const dependencies = selectedDeps.join(',');
    const url = `https://start.spring.io/starter.zip?type=${buildTool.toLowerCase()}-project&language=java&bootVersion=3.3.5&javaVersion=${javaVersion}&groupId=${group.toLowerCase()}&artifactId=${artifact.toLowerCase()}&name=${projectName.toLowerCase()}&dependencies=${dependencies}`;

    try{
        // fetch zip file
        const buffer = execSync(`curl -sL \"${url}\"`, {encoding: 'buffer'});

        // create project path
        const projectPath = path.join(process.cwd(), projectName.toLowerCase());
        fsExtra.ensureDirSync(projectPath);


        // load zip file
        const zip = new AdmZip(Buffer.from(buffer));

        // extract zip
        zip.extractAllTo(projectPath, true);

        console.log(`${chalk.green.bold('✔')} Project create successfully.`)
    }
    catch(error) {
        console.log(`${chalk.red.bold('⚠')} Error creating spring boot project: `,error.message);
    }
}

// private functions
const generateJavaFile = (name, type, content) => {
    const javaSrcPath = path.join(process.cwd(), "src", "main", "java");
    const pathToCreateFile = `${javaSrcPath}/${getMainJavaPackageAsPath()}/${type.toLowerCase()}`;
    const modifiedType = type.split("/")[0];
    const captilizedType = captializeFirstLetter(modifiedType);
    let concatName = name;
    type.split("/").map((str) => {
        if (modifiedType == "model") return;
        else if (!concatName.includes(captilizedType)) concatName += captilizedType
        else concatName += captializeFirstLetter(str);
    });
    const createFileName = concatName;

    console.log(`Creating ${type.toLowerCase()} ${chalk.green(name + '...')}`);

    // check path and file exist
    const configFilePath = `${javaSrcPath}/${getMainJavaPackageAsPath()}/config`;
    if (!fs.existsSync(configFilePath)) {

        fs.mkdirSync(configFilePath, { recursive: true });

        if (!fs.existsSync(`${configFilePath}/seeder`)) {
            fs.mkdirSync(`${configFilePath}/seeder`, { recursive: true });
            createSeederConfigFiles(`${configFilePath}/seeder`);
        }

        createGlobalCommandLineConfigFile(configFilePath);
    }

    if (!fs.existsSync(pathToCreateFile)) fs.mkdirSync(pathToCreateFile, { recursive: true });
    if (fs.existsSync(`${pathToCreateFile}/${createFileName}.java`)) {
        console.log(`${chalk.yellow.bold('⚠')}  ${createFileName} already exists`);
        return;
    }

    fs.writeFile(`${pathToCreateFile}/${createFileName}.java`, content, (err) => {
        if (err) console.error(`${chalk.red.bold('⚠')} Error creating the file:${err}`);
        else console.log(`${chalk.green.bold("✔")} ${createFileName} created successfully!`);
    });
}

const createSeederConfigFiles = (path) => {
    const pathToCreateFile = path;
    const classPath = getMainJavaPackageAsClassPath();
    const seederInterfaceConfigContent = seederConfigFileContent(classPath);
    const seederManagerContent = seederManagerFileContent(classPath);

    fs.writeFile(`${pathToCreateFile}/Seeder.java`, seederInterfaceConfigContent, () => { });
    fs.writeFile(`${pathToCreateFile}/SeederManager.java`, seederManagerContent, () => { });
}

const createGlobalCommandLineConfigFile = (path) => {
    const pathToCreateFile = path;
    const classPath = getMainJavaPackageAsClassPath();
    const globalCommandLineRunnerContent = globalCommandLineRunnerFileContent(classPath);

    fs.writeFile(`${pathToCreateFile}/GlobalCommandLineRunner.java`, globalCommandLineRunnerContent, () => { });
}