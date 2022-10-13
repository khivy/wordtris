FROM openjdk:17-alpine

COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY src src

RUN chmod +x ./gradlew

RUN ./gradlew bootJar --info  -x extractProto -x generateProto -x extractTestProto
VOLUME /tmp
#RUN rm build/libs/*-plain.jar
#COPY build/libs/*.jar app.jar
RUN ls
ENTRYPOINT ["java","-jar","build/libs/*.jar"]
