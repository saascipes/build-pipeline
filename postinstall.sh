cd server
npm i

cd ..

cd clientv1
npm i

cd ..

if [ "$NODE_ENV" == "test" ]
then
    npm test
fi
