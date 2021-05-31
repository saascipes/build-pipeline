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


resource "kubernetes_deployment" "spa-build-pipeline-agent" {
  metadata {
    name = "spa-build-pipeline-agent-deployment"
    namespace = "spa-${var.demo_id}-${var.environment}"
    labels = {
      App = "spa-build-pipeline-agent"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        App = "spa-build-pipeline-agent"
      }
    }
    template {
      metadata {
        labels = {
          App = "spa-build-pipeline-agent"
        }
      }
      spec {
        container {
          image = "${var.ecruri}/spa_build_pipeline_agent_1:${var.sg_agent_version}"
          name  = "spa-build-pipeline-agent"

          resources {
            limits = {
              cpu    = "0.5"
              memory = "4096Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "4096Mi"
            }
          }
        }
        node_selector = {
            "node.kubernetes.io/instance-type" = "m5a.large"
        }
      }
    }
  }
}

