cd server
npm i

cd ..

if [ "$NODE_ENV" == "test" ]
then
    npm test
fi
