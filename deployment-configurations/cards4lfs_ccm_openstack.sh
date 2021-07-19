#!/bin/bash

# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# Prerequisites:
# - SSL certificates and keys in compose-cluster/SSL_CONFIG
#   - certificate.crt
#   - certificatekey.key
#   - certificatechain.crt
#
# - Docker images
#   - lfs/lfs
#   - ccmsk/neuralcr (version with HP preloaded model)
#

DOCKER_COMPOSE_SUBNET='172.19.0.0/16'
DOCKER_COMPOSE_HOST_IP='172.19.0.1'

MONGO_DB_VOLUME_MOUNT=$(realpath ~/cards4lfs_mongodb)
mkdir $MONGO_DB_VOLUME_MOUNT

PROJECT_ROOT=$(realpath ../)

#We will use a single mongoDB instance for data persistence
docker pull mongo:4.2-bionic || exit -1
docker run -p 27017:27017 -v $MONGO_DB_VOLUME_MOUNT:/data/db --name mongolfs -d mongo:4.2-bionic || exit -1

#Wait for mongoDB to start
while true
do
  echo "Waiting for mongoDB to start"
  sleep 5
  docker exec mongolfs mongo --eval 'db.runCommand("ping").ok' && break
done

#Generate the docker-compose environment
cd $PROJECT_ROOT/compose-cluster
echo "ADDITIONAL_RUN_MODES=lfs,dev,permissions_trusted" > custom_env.env
echo "BIOPORTAL_APIKEY=$BIOPORTAL_APIKEY" >> custom_env.env
CARDS_EXT_MONGO_AUTH='' python3 generate_compose_yaml.py \
  --external_mongo \
  --external_mongo_address $DOCKER_COMPOSE_HOST_IP \
  --external_mongo_dbname sling \
  --enable_ncr \
  --ssl_proxy \
  --sling_admin_port 8081 \
  --custom_env_file custom_env.env \
  --subnet $DOCKER_COMPOSE_SUBNET

#Add the docker-compose.override.yml file and any other other needed resources
cp $PROJECT_ROOT/deployment-configurations/resources/cards4lfs_ccm_openstack/docker-compose.override.yml .
cp $PROJECT_ROOT/deployment-configurations/resources/cards4lfs_ccm_openstack/registered_models.py ncr_registered_models.py

docker-compose build || exit -1
docker-compose up -d cardsinitial || exit -1

#All configurations on CARDS will be done through this URL
export CARDS_URL=http://localhost:8081

#Wait for CARDS to start
while true
do
  echo "Waiting for CARDS to start"
  curl --fail $CARDS_URL/system/sling/info.sessionInfo.json && break
  sleep 5
done
echo ""

#Set the admin password
cd $PROJECT_ROOT/Utilities/Administration
if [ -z "$CARDS_DEPLOYMENT_ADMIN_PASSWORD" ]
then
  echo "CARDS_DEPLOYMENT_ADMIN_PASSWORD unspecified, generating a random one"
  export CARDS_DEPLOYMENT_ADMIN_PASSWORD=$(openssl rand -hex 8)
  echo ""
  echo "**********************************************************"
  echo -n "Admin password for this deployment is: "
  printenv CARDS_DEPLOYMENT_ADMIN_PASSWORD
  echo "**********************************************************"
  echo ""
fi
printenv CARDS_DEPLOYMENT_ADMIN_PASSWORD | python3 set_sling_password.py || exit -1

#Install the required vocabularies
echo "Installing vocabularies..."
cd $PROJECT_ROOT/Utilities/Administration
export ADMIN_PASSWORD=$CARDS_DEPLOYMENT_ADMIN_PASSWORD
./install_required_vocabularies.sh || exit -1

#Download the required NCR models
echo "Downloading NCR models..."
mkdir $PROJECT_ROOT/compose-cluster/NCR_MODEL
cd $PROJECT_ROOT/Utilities/NCR-Downloader

#pmc_model_new.bin
if [ ! -f $PROJECT_ROOT/compose-cluster/NCR_MODEL/pmc_model_new.bin ]
then
  python3 download_model.py \
    --download pmc_model_new.bin \
    --savedir $PROJECT_ROOT/compose-cluster/NCR_MODEL || exit -1
fi

#HP - Human Phenotype Ontology
if [ ! -d $PROJECT_ROOT/compose-cluster/NCR_MODEL/HP ]
then
  python3 download_model.py \
    --download HP \
    --savedir $PROJECT_ROOT/compose-cluster/NCR_MODEL || exit -1
fi

#Almost ready to go, but a few things will need to be configured manually
echo "Please login to CARDS through the localhost address and configure the user accounts, including LDAP"
echo "Once configured (ensuring that all default login credentials are changed) start everything else with:"
echo ""
echo "cd $PROJECT_ROOT/compose-cluster"
echo "docker-compose up -d"
echo ""
echo "cards4lfs_ccm_openstack deployment will be ready at https://lfs.ccm.sickkids.ca"
echo "It is recommended to login and ensure that all services, including NCR, are working as expected"