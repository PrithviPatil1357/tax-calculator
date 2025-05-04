# Use a base image with Java 17 (matching your pom.xml) and Maven for building
FROM maven:3.9-eclipse-temurin-17-focal AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven project file
COPY pom.xml .

# Copy the Maven wrapper files
COPY .mvn/ .mvn
COPY mvnw .

# Download dependencies first to leverage Docker cache
# RUN ./mvnw dependency:go-offline -B
# ^^ Note: dependency:go-offline can sometimes be tricky with complex projects.
# We'll skip it for now for simplicity, but it's good for optimization later.

# Copy the source code
COPY src ./src

# Package the application using the Maven wrapper, skipping tests
RUN ./mvnw package -DskipTests

# --- Second Stage: Create the final lightweight image ---

# Use a minimal Java runtime image
FROM eclipse-temurin:17-jre-focal

WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/tax-calculator-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the application runs on (default for Spring Boot is 8080)
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 