const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = 3000;

// Create a Registry to register the metrics
const register = new client.Registry();

// Enable collection of default metrics
client.collectDefaultMetrics({ register });

// Create a custom histogram to measure request duration
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 1.5, 2, 5, 10, 20, 30] // define your own buckets
});

register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request durations
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, Prometheus!');
});

// Expose metrics on /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
