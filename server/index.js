const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const AppServer = require('../src/AppServer').default;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    console.log('GET');
    const data = {request_type: 'report'};
    
    //make the code wait for this call to return...
    /*
    const { pipe, abort } = ReactDOMServer.renderToPipeableStream(
      <StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
          <AppServer data={data} />
        </Suspense>
      </StrictMode>    
    );
    pipe(res);
    */

    const content = ReactDOMServer.renderToString(<AppServer data={data} />);
    console.log('content: ', content);

    res.send('<p>Loading...</p>');
    res.end();
});

app.post('/', (req, res) => {
  console.log('POST');
  const data = req.body
  const content = ReactDOMServer.renderToString(<AppServer data={data} />);
  res.send(content)
  res.end()
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
