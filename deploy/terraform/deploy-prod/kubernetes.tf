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


resource "kubernetes_namespace" "sg-demo-build-pipeline-ns" {
  metadata {
    name = "sg-demo-${var.demo_id}-${var.environment}"
  }
}


resource "kubernetes_service" "sg-demo-buildpipeline-db" {
  metadata {
    name = "sg-demo-mongodb"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
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
    kubernetes_namespace.sg-demo-build-pipeline-ns
  ]
}


resource "kubernetes_stateful_set" "sg-demo-buildpipeline-db-ss" {
  metadata {
    name = "mongodb-stateful-set"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
  }

  spec {
    service_name = "sg-demo-mongodb"
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
    kubernetes_namespace.sg-demo-build-pipeline-ns
  ]
}


resource "kubernetes_service" "sg-demo-buildpipeline-api" {
  metadata {
    name = "sg-demo-buildpipeline-api-service"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
  }
  spec {
    selector = {
      App = kubernetes_deployment.sg-demo-buildpipeline-api.metadata.0.labels.App
    }
    port {
      port        = 3000
      target_port = 3000
    }

    type = "NodePort"
  }
  depends_on = [
    kubernetes_namespace.sg-demo-build-pipeline-ns
  ]
}


resource "kubernetes_deployment" "sg-demo-buildpipeline-api" {
  metadata {
    name = "sg-demo-buildpipeline-api-deployment"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
    labels = {
      App = "sg-demo-buildpipeline-api"
    }
  }

  spec {
    replicas = 3
    selector {
      match_labels = {
        App = "sg-demo-buildpipeline-api"
      }
    }
    template {
      metadata {
        labels = {
          App = "sg-demo-buildpipeline-api"
        }
      }
      spec {
        container {
          image = "948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_api:latest"
          name  = "sg-demo-buildpipeline-api"

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
    kubernetes_namespace.sg-demo-build-pipeline-ns,
    kubernetes_stateful_set.sg-demo-buildpipeline-db-ss
  ]
}


resource "kubernetes_service" "sg-demo-buildpipeline-client" {
  metadata {
    name = "sg-demo-buildpipeline-client-service"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
  }
  spec {
    selector = {
      App = kubernetes_deployment.sg-demo-buildpipeline-client.metadata.0.labels.App
    }
    port {
      port        = 80
      target_port = 8080
    }

    type = "LoadBalancer"
  }
}


resource "kubernetes_deployment" "sg-demo-buildpipeline-client" {
  metadata {
    name = "sg-demo-buildpipeline-client-deployment"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
    labels = {
      App = "sg-demo-buildpipeline-client"
    }
  }

  spec {
    replicas = 3
    selector {
      match_labels = {
        App = "sg-demo-buildpipeline-client"
      }
    }
    template {
      metadata {
        labels = {
          App = "sg-demo-buildpipeline-client"
        }
      }
      spec {
        container {
          image = "948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_buildpipeline_client:latest"
          name  = "sg-demo-buildpipeline-client"

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
    kubernetes_deployment.sg-demo-buildpipeline-api
  ]
}


resource "kubernetes_deployment" "sg-demo-buildpipeline-stock-quote-publisher" {
  metadata {
    name = "sg-demo-buildpipeline-stock-quote-publisher-deployment"
    namespace = "sg-demo-${var.demo_id}-${var.environment}"
    labels = {
      App = "sg-demo-buildpipeline-stock-quote-publisher"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "sg-demo-buildpipeline-stock-quote-publisher"
      }
    }
    template {
      metadata {
        labels = {
          App = "sg-demo-buildpipeline-stock-quote-publisher"
        }
      }
      spec {
        container {
          image = "948032566234.dkr.ecr.us-east-1.amazonaws.com/sg_demo_stock_quote_publisher:${var.stock_publisher_version}"
          name  = "sg-demo-buildpipeline-stock-quote-publisher"

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
    kubernetes_deployment.sg-demo-buildpipeline-api
  ]
}
