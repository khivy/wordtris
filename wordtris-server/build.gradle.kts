import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import com.google.protobuf.gradle.*

group = "khivy"
version = "1.0.0"
java.sourceCompatibility = JavaVersion.VERSION_17

tasks.getByName<Jar>("bootJar") {
    this.archiveFileName.set("app.jar")
}

plugins {
    id("org.springframework.boot") version "2.7.4"
    id("io.spring.dependency-management") version "1.0.14.RELEASE"
    kotlin("jvm") version "1.6.21"
    kotlin("plugin.spring") version "1.6.21"
    kotlin("plugin.jpa") version "1.6.21"
    id("java")
    id("idea")
    id("com.google.protobuf") version "0.8.19"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-mustache")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("com.google.protobuf:protobuf-gradle-plugin:0.8.19")
    implementation("com.google.protobuf:protobuf-kotlin:3.21.6")
    implementation("org.springframework.data:spring-data-bom:2021.2.3")
    implementation("redis.clients:jedis:4.2.3")
    implementation("org.springframework.data:spring-data-redis:2.7.3")
    implementation("com.bucket4j:bucket4j-core:8.1.0")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    implementation("io.lettuce:lettuce-core:6.2.0.RELEASE")
    runtimeOnly("com.h2database:h2")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("mysql:mysql-connector-java")
    implementation("org.springframework.boot:spring-boot-starter-test:2.7.3")
    implementation("com.google.protobuf:protobuf-java:3.21.6")
    implementation("io.grpc:grpc-stub:1.49.1")
    implementation("io.grpc:grpc-protobuf:1.49.1")
    if (JavaVersion.current().isJava9Compatible()) {
        // Workaround for @javax.annotation.Generated
        // see: https://github.com/grpc/grpc-java/issues/3633
        implementation("javax.annotation:javax.annotation-api:1.3.1")
    }
	protobuf(files("../protobuf/"))
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.21.6"
    }

    generatedFilesBaseDir = "$projectDir/src/main/kotlin/khivy/wordtrisserver/protobuf_gen/"

    generateProtoTasks {
        ofSourceSet("main").forEach {
            it.builtins {
                id("kotlin")
            }
        }
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
