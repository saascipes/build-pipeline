terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.20.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.1"
    }
  }
}

data "terraform_remote_state" "eks" {
  backend = "local"

  config = {
    path = "../provision/terraform.tfstate"
  }
}

# Retrieve EKS cluster information
provider "aws" {
  region = data.terraform_remote_state.eks.outputs.region
}

data "aws_eks_cluster" "cluster" {
  name = data.terraform_remote_state.eks.outputs.cluster_id
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  exec {
    api_version = "client.authentication.k8s.io/v1alpha1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      data.aws_eks_cluster.cluster.name
    ]
  }
}


resource "kubernetes_namespace" "spa-build-pipeline-ns" {
  metadata {
    name = "spa-${var.demo_id}-${var.environment}"
  }
}


resource "kubernetes_service" "spa-build-pipeline-db" {
  metadata {
    name = "spa-mongodb"
    namespace = "spa-${var.demo_id}-${var.environment}"
    labels = {
      name: "mongodb"
    }
  }
  spec {
    selector = {
      name: "mongodb"
    }
    port {
      port        = 27017
      target_port = 27017
    }
  }
  depends_on = [
    kubernetes_namespace.spa-build-pipeline-ns
  ]
}


resource "kubernetes_stateful_set" "spa-build-pipeline-db-ss" {
  metadata {
    name = "mongodb-stateful-set"
    namespace = "spa-${var.demo_id}-${var.environment}"
  }

  spec {
    service_name = "spa-mongodb"
    replicas = 1
    selector {
        match_labels = {
          name = "mongodb"
        }
    }
    template {
      metadata {
        labels = {
          name = "mongodb"
        }
      }
      spec {
        container {
          image = "mongo:latest"
          name = "mongodb-standalone"

          port {
            container_port = 27017 
          }
        }
        node_selector = {
            "node.kubernetes.io/instance-type" = "m5a.large"
        }
      }
    }
  }
  depends_on = [
    kubernetes_namespace.spa-build-pipeline-ns
  ]
}


resource "kubernetes_service" "spa-build-pipeline-api" {
  metadata {
    name = "spa-build-pipeline-api-service"
    namespace = "spa-${var.demo_id}-${var.environment}"
  }
  spec {
    selector = {
      App = kubernetes_deployment.spa-build-pipeline-api.metadata.0.labels.App
    }
    port {
      port        = 3000
      target_port = 3000
    }

    type = "NodePort"
  }
  depends_on = [
    kubernetes_namespace.spa-build-pipeline-ns
  ]
}


resource "kubernetes_deployment" "spa-build-pipeline-api" {
  metadata {
    name = "spa-build-pipeline-api-deployment"
    namespace = "spa-${var.demo_id}-${var.environment}"
    labels = {
      App = "spa-build-pipeline-api"
    }
  }

  spec {
    replicas = 3
    selector {
      match_labels = {
        App = "spa-build-pipeline-api"
      }
    }
    template {
      metadata {
        labels = {
          App = "spa-build-pipeline-api"
        }
      }
      spec {
        container {
          image = "${var.ecruri}/spa_build_pipeline_api:latest"
          name  = "spa-build-pipeline-api"

          port {
            container_port = 3000 
          }

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_namespace.spa-build-pipeline-ns,
    kubernetes_stateful_set.spa-build-pipeline-db-ss
  ]
}


resource "kubernetes_service" "spa-build-pipeline-client" {
  metadata {
    name = "spa-build-pipeline-client-service"
    namespace = "spa-${var.demo_id}-${var.environment}"
  }
  spec {
    selector = {
      App = kubernetes_deployment.spa-build-pipeline-client.metadata.0.labels.App
    }
    port {
      port        = 80
      target_port = 8080
    }

    type = "LoadBalancer"
  }
}


resource "kubernetes_deployment" "spa-build-pipeline-client" {
  metadata {
    name = "spa-build-pipeline-client-deployment"
    namespace = "spa-${var.demo_id}-${var.environment}"
    labels = {
      App = "spa-build-pipeline-client"
    }
  }

  spec {
    replicas = 3
    selector {
      match_labels = {
        App = "spa-build-pipeline-client"
      }
    }
    template {
      metadata {
        labels = {
          App = "spa-build-pipeline-client"
        }
      }
      spec {
        container {
          image = "${var.ecruri}/spa_build_pipeline_client:latest"
          name  = "spa-build-pipeline-client"

          port {
            container_port = 8080
          }

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_deployment.spa-build-pipeline-api
  ]
}


resource "kubernetes_deployment" "spa-build-pipeline-stock-quote-publisher" {
  metadata {
    name = "spa-build-pipeline-stock-quote-publisher-deployment"
    namespace = "spa-${var.demo_id}-${var.environment}"
    labels = {
      App = "spa-build-pipeline-stock-quote-publisher"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "spa-build-pipeline-stock-quote-publisher"
      }
    }
    template {
      metadata {
        labels = {
          App = "spa-build-pipeline-stock-quote-publisher"
        }
      }
      spec {
        container {
          image = "${var.ecruri}/spa_stock_quote_publisher:${var.stock_publisher_version}"
          name  = "spa-build-pipeline-stock-quote-publisher"

          port {
            container_port = 8080
          }

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "50Mi"
            }
          }
        }
      }
    }
  }
  depends_on = [
    kubernetes_deployment.spa-build-pipeline-api
  ]
}
