import app from './app.js';

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`AI Resume ATS Analyzer Pro API running on ${port}`);
});
