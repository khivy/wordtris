FROM openjdk:17-alpine

COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY src src
RUN chmod +x ./gradlew
RUN ./gradlew bootJar --info  -x extractProto -x generateProto -x extractTestProto
VOLUME /tmp

# If you'd rather build a jar separately, comment out the above block and uncomment the line below.
#COPY build/libs/*.jar app.jar

RUN ls
ENTRYPOINT ["java","-jar","build/libs/*.jar"]
