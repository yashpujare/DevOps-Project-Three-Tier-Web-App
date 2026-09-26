pipeline{
    agent any

    stages{
        stage("clone repo"){
            steps{
                echo "This is cloning source code from Github"
                git url: "https://github.com/yashpujare/DevOps-Project-Three-Tier-Web-App", branch:"main"
            }

        }

        stage("Prepare Environment"){
            steps{
                echo 'Preparing runtime .env file...'
                sh '''
                    if [ ! -f .env ]; then
                        cp .env.example .env
                    fi
                '''           
            }

        }

        stage("Deploy with Docker Compose"){
            steps{
                sh "docker compose down"
                sh "docker compose up -d --build"
            }
        }



    }
    
    post {
        always{
            echo "Cleaning up unused docker resources"
            sh "docker system prune -f"
        }
    }

        

}