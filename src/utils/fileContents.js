import { isPropertiesOrYML, getYMLData, getPropertiesData, scanModelDirectory } from "./index.js";
import fs from "fs";
import path from "path";

const javaSrcPath = path.join(process.cwd(), "src", "main", "java");

export const modelFileContent = (className, packageName) => {
    return "package " + packageName + ".model;\n" +
        "\n" +
        "import jakarta.persistence.*;\n" +
        "import lombok.Data;\n" +
        "import org.hibernate.annotations.CreationTimestamp;\n" +
        "import org.hibernate.annotations.UpdateTimestamp;\n" +
        "import java.util.Date;\n" +
        "\n" +
        "@Data\n" +
        "@Entity\n" +
        "@Table(name = \"" + className.toLowerCase() + "s\")\n" +
        "public class " + className + " {\n" +
        "    @Id\n" +
        "    @GeneratedValue(strategy = GenerationType.IDENTITY)\n" +
        "    private long id;\n" +
        "\n" +
        "    @CreationTimestamp\n" +
        "    @Column(updatable = false, name = \"created_at\")" +
        "    private Date createdAt;\n" +
        "\n" +
        "    @UpdateTimestamp\n" +
        "    @Column(name = \"updated_at\")\n" +
        "    private Date updatedAt;\n" +
        "}";
}

export const repoFileContent = (className, packageName) => {
    return "package " + packageName + ".repository;\n" +
        "\n" +
        "import " + packageName + ".model." + className + ";\n" +
        "import org.springframework.data.jpa.repository.JpaRepository;\n" +
        "import org.springframework.stereotype.Repository;\n" +
        "\n" +
        "@Repository\n" +
        "public interface " + className + "Repository extends JpaRepository<" + className + ", Long> {\n" +
        "}";
}

export const serviceFileContent = (className, packageName) => {
    return "package " + packageName + ".service;\n" +
        "\n" +
        "public interface " + className + "Service {\n" +
        "}";
}

export const serviceImplFileContent = (className, packageName) => {
    let importRepo = "";
    let injectRepo = "";
    const importService = "import " + packageName + ".service." + className + "Service;\n"; 

    const repoPath = javaSrcPath + "/" + packageName.replaceAll(".", "/") + "/repository/" + className + "Repository.java";

    if (fs.existsSync(repoPath)) {
        injectRepo = "    private final " + className + "Repository " + className.toLowerCase() + "Repository;\n"
        importRepo = "import " + packageName + ".service." + className + "Service;\n"; 
    }

    return "package " + packageName + ".service.impl;\n" +
        "\n" +
        importRepo +
        importService +
        "import lombok.RequiredArgsConstructor;\n" +
        "import org.springframework.stereotype.Service;\n" +
        "\n" +
        "@Service\n" +
        "@RequiredArgsConstructor\n" +
        "public class " + className + "ServiceImpl implements " + className + "Service {\n" +
        "\n" +
        injectRepo +
        "}";
}

export const seederFileContent = (className, packageName) => {

    return "package " + packageName + ".seeder;\n" +
        "\n" +
        "import " + packageName + ".model." + className + ";\n" +
        "import " + packageName + ".repository." + className + "Repository;\n" +
        "import " + packageName + ".config.seeder.Seeder;\n" +
        "import lombok.RequiredArgsConstructor;\n" +
        "import lombok.extern.slf4j.Slf4j;\n" +
        "import org.springframework.stereotype.Component;\n" +
        "\n" +
        "@Component\n" +
        "@RequiredArgsConstructor\n" +
        "@Slf4j\n" +
        "public class " + className + "Seeder implements Seeder {\n" +
        "\n" +
        "    private final " + className + "Repository " + className.toLowerCase() + "Repository;\n" +
        "    \n" +
        "    private void seed" + className + "s(){\n" +
        "    }\n" +
        "\n" +
        "    @Override\n" +
        "    public void runSeeder() {\n" +
        "        try{\n" +
        "            seed" + className + "s();\n" +
        "            log.info(\"Success run " + className.toLowerCase() + " seeder\");\n" +
        "        }\n" +
        "        catch (Exception e){\n" +
        "            log.info(\"Fail to run " + className.toLowerCase() + " seeder\");\n" +
        "        }\n" +
        "    }\n" +
        "}";
}

export const controllerFileContent = (className, packageName, mode = "rest", option = "") => {

    let inject = "";
    let importRepoOrService = "";
    let resourceType = isPropertiesOrYML();
    let apiVersion = "v1";
    let checkModelExist = scanModelDirectory();

    if (!resourceType && resourceType == "properties") apiVersion = getPropertiesData().get("api.version") ?? "v1";
    else apiVersion = getYMLData()?.api?.version ?? "v1";



    let route = mode !== "rest" ? `/${className.toLowerCase()}` : `/api/${apiVersion}/${className.toLowerCase()}`;

    if (fs.existsSync(javaSrcPath + "/" + packageName.replaceAll(".", "/") + "/service/" + className + "Service.java")) {
        inject = "    private final " + className + "Service " + className.toLowerCase() + "Service;\n";
        importRepoOrService = "import " + packageName + ".service." + className + "Service;\n";
    }

    if (fs.existsSync(javaSrcPath + "/" + packageName.replaceAll(".", "/") + "/repository/" + className + "Repository.java")) {
        inject = "    private final " + className + "Repository " + className.toLowerCase() + "Repository;\n";
        importRepoOrService = "import " + packageName + ".repository." + className + "Repository;\n";
    }

    return "package " + packageName + ".controller;\n" +
        "\n" +
        (checkModelExist.includes(className.toLowerCase()) ? "import " + packageName + ".model." + className + ";\n" : "") +
        importRepoOrService +
        (mode == "controller" ? "import org.springframework.stereotype.Controller;\n" : "") +
        (inject != "" ? "import lombok.RequiredArgsConstructor;\n" : "") +
        "import lombok.extern.slf4j.Slf4j;\n" +
        "import org.springframework.http.ResponseEntity;\n" +
        "import org.springframework.web.bind.annotation.*;\n" +
        "\n" +
        (mode !== "rest" ? "@Controller\n" : "@RestController\n") +
        (inject !== "" ? "@RequiredArgsConstructor\n" : "") +
        "@RequestMapping(\"" + route + "\")\n" +
        "@Slf4j\n" +
        "public class " + className + "Controller {\n" +
        "\n" +
        inject +
        "\n" +
        (option == "resource" ?
            "    /**\n" +
            "     *\n" +
            "     * @return\n" +
            "     */\n" +
            "    @GetMapping\n" +
            "    public ResponseEntity<?> getAll(){\n" +
            "       return null;\n" +
            "    }\n" +
            "\n" +
            "    /**\n" +
            "     *\n" +
            "     * @param id\n" +
            "     * @return\n" +
            "     */\n" +
            "    @GetMapping(\"/{id}\")\n" +
            "    public ResponseEntity<?> getById(@PathVariable Long id){\n" +
            "       return null;\n" +
            "    }\n" +
            "\n" +
            "    /**\n" +
            "     *\n" +
            "     * @param " + className.toLowerCase() + "\n" +
            "     * @return\n" +
            "     */\n" +
            "    @PostMapping(\"/add\")\n" +
            "    public ResponseEntity<?> add(@RequestBody " + className + " " + className.toLowerCase() + "){\n" +
            "       return null;\n" +
            "    }\n" +
            "\n" +
            "    /**\n" +
            "     * @param id\n" +
            "     * @param " + className.toLowerCase() + "\n" +
            "     * @return\n" +
            "     */\n" +
            "    @PutMapping(\"/update/{id}\")\n" +
            "    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody " + className + " " + className.toLowerCase() + "){\n" +
            "       return null;\n" +
            "    }\n" +
            "\n" +
            "    /**\n" +
            "     * @param id\n" +
            "     * @return\n" +
            "     */\n" +
            "    @DeleteMapping(\"/delete/{id}\")\n" +
            "    public ResponseEntity<?> delete(@PathVariable Long id) {\n" +
            "       return null;\n" +
            "    }\n"
            : "") +
        "}\n";
}

export const seederConfigFileContent = (packageName) => {
    return "package " + packageName + ".config.seeder;\n" +
        "\n" +
        "public interface Seeder {\n" +
        "    void runSeeder();\n" +
        "}\n";
}

export const seederManagerFileContent = (packageName) => {
    return "package " + packageName + ".config.seeder;\n" +
        "\n" +
        "import lombok.extern.slf4j.Slf4j;\n" +
        "import org.springframework.beans.factory.annotation.Autowired;\n" +
        "import org.springframework.stereotype.Service;\n" +
        "\n" +
        "import java.util.HashMap;\n" +
        "import java.util.List;\n" +
        "import java.util.Map;\n" +
        "\n" +
        "@Service\n" +
        "@Slf4j\n" +
        "public class SeederManager {\n" +
        "\n" +
        "    private final Map<String, Seeder> seederMap = new HashMap<>();\n" +
        "\n" +
        "    @Autowired // inject all seeder\n" +
        "    public SeederManager(List<Seeder> seeders){\n" +
        "        // Register all seeders with names for easy lookup\n" +
        "        seeders.forEach(seeder -> {\n" +
        "            seederMap.put(seeder.getClass().getSimpleName()           // get class name\n" +
        "                    .replace(\"Seeder\", \"\") // replace seeder with blank(eg.RoleSeeder to Role)\n" +
        "                    .replaceAll(\"([a-z])([A-Z])\",\"$1_$2\") // add underscore between camel case\n" +
        "                    .toLowerCase(),\n" +
        "                    seeder);\n" +
        "        });\n" +
        "    }\n" +
        "\n" +
        "    public void runAllSeeders(){\n" +
        "        seederMap.values().forEach(Seeder::runSeeder);\n" +
        "    }\n" +
        "\n" +
        "    public void runOneSeeder(String seederName){\n" +
        "        Seeder seeder = seederMap.get(seederName.toLowerCase());\n" +
        "\n" +
        "        if(seeder != null) seeder.runSeeder();\n" +
        "        else log.error(\"Seeder Not Found:{}\", seederName);\n" +
        "    }\n" +
        "}\n";
}

export const globalCommandLineRunnerFileContent = (packageName) => {
    return "package " + packageName + ".config;\n" +
            "\n" +
            "import " + packageName + ".config.seeder.SeederManager;\n" +
            "import lombok.extern.slf4j.Slf4j;\n" +
            "import org.springframework.beans.factory.annotation.Autowired;\n" +
            "import org.springframework.boot.CommandLineRunner;\n" +
            "import org.springframework.boot.SpringApplication;\n" +
            "import org.springframework.context.ApplicationContext;\n" +
            "import org.springframework.stereotype.Component;\n" +
            "\n" +
            "\n" +
            "@Component\n" +
            "@Slf4j\n" +
            "public class GlobalCommandLineRunner implements CommandLineRunner {\n" +
            "\n" +
            "    @Autowired\n" +
            "    private ApplicationContext context;\n" +
            "\n" +
            "    @Autowired\n" +
            "    private SeederManager seederManager;\n" +
            "\n" +
            "    boolean isRunCommand = false;\n" +
            "\n" +
            "    @Override\n" +
            "    public void run(String... args) throws Exception {\n" +
            "\n" +
            "        if (args.length > 0) {\n" +
            "            for (String arg : args) {\n" +
            "\n" +
            "                // if argument is present\n" +
            "                if (arg.startsWith(\"--seeder=\")) {\n" +
            "                        seedAction(arg);\n" +
            "                }\n" +
            "            }\n" +
            "        } else log.warn(\"No command provide.\");\n" +
            "\n" +
            "        if (isRunCommand) SpringApplication.exit(context, () -> 0);\n" +
            "    }\n" +
            "\n" +
            "    private void seedAction(String arg){\n" +
            "        isRunCommand = true;\n" +
            "        String seederName = arg.split(\"=\")[1];\n" +
            "        if (seederName.equals(\"all\")) seederManager.runAllSeeders();\n" +
            "        else seederManager.runOneSeeder(seederName);\n" +
            "    }\n" +
            "}\n";
}
