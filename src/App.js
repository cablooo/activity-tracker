import React, { useState, useEffect } from 'react';
import './App.css';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState('daily');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/activity_data.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError('Could not load activity data');
      }
    };

    fetchData(); 
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getViewData = () => {
    if (!data) return null;

    const dailyStats = data.daily_stats;
    const dates = Object.keys(dailyStats).sort();
    const today = dates[dates.length - 1];

    if (view === 'alltime') {
      return {
        clicks: data.total_clicks.left + data.total_clicks.right + data.total_clicks.middle,
        leftClicks: data.total_clicks.left,
        rightClicks: data.total_clicks.right,
        middleClicks: data.total_clicks.middle,
        keys: data.total_keys,
        distance: (data.total_mouse_movement_pixels / 1000000).toFixed(2),
        sessions: data.total_sessions,
        chartDates: dates.slice(-30),
        chartData: dates.slice(-30).map(date => ({
          clicks: dailyStats[date].mouse_clicks.left + dailyStats[date].mouse_clicks.right + dailyStats[date].mouse_clicks.middle,
          keys: dailyStats[date].keyboard_presses,
          distance: (dailyStats[date].mouse_movement_pixels / 1000).toFixed(1)
        }))
      };
    }

    if (view === 'weekly') {
      const last7Days = dates.slice(-7);
      let weekClicks = 0, weekKeys = 0, weekDistance = 0, weekSessions = 0;
      let leftClicks = 0, rightClicks = 0, middleClicks = 0;

      last7Days.forEach(date => {
        const day = dailyStats[date];
        weekClicks += day.mouse_clicks.left + day.mouse_clicks.right + day.mouse_clicks.middle;
        leftClicks += day.mouse_clicks.left;
        rightClicks += day.mouse_clicks.right;
        middleClicks += day.mouse_clicks.middle;
        weekKeys += day.keyboard_presses;
        weekDistance += day.mouse_movement_pixels;
        weekSessions += day.sessions.length;
      });

      return {
        clicks: weekClicks,
        leftClicks,
        rightClicks,
        middleClicks,
        keys: weekKeys,
        distance: (weekDistance / 1000000).toFixed(2),
        sessions: weekSessions,
        chartDates: last7Days,
        chartData: last7Days.map(date => ({
          clicks: dailyStats[date].mouse_clicks.left + dailyStats[date].mouse_clicks.right + dailyStats[date].mouse_clicks.middle,
          keys: dailyStats[date].keyboard_presses,
          distance: (dailyStats[date].mouse_movement_pixels / 1000).toFixed(1)
        }))
      };
    }

    // Daily
    const todayData = dailyStats[today];
    return {
      clicks: todayData.mouse_clicks.left + todayData.mouse_clicks.right + todayData.mouse_clicks.middle,
      leftClicks: todayData.mouse_clicks.left,
      rightClicks: todayData.mouse_clicks.right,
      middleClicks: todayData.mouse_clicks.middle,
      keys: todayData.keyboard_presses,
      distance: (todayData.mouse_movement_pixels / 1000000).toFixed(2),
      sessions: todayData.sessions.length,
      chartDates: [today],
      chartData: [{
        clicks: todayData.mouse_clicks.left + todayData.mouse_clicks.right + todayData.mouse_clicks.middle,
        keys: todayData.keyboard_presses,
        distance: (todayData.mouse_movement_pixels / 1000).toFixed(1)
      }]
    };
  };

  const viewData = data ? getViewData() : null;

  const clicksDistributionData = viewData ? {
    labels: ['Left Clicks', 'Right Clicks', 'Middle Clicks'],
    datasets: [{
      data: [viewData.leftClicks, viewData.rightClicks, viewData.middleClicks],
      backgroundColor: ['#1e3a8a', '#0f766e', '#374151'],
      borderColor: '#151111',
      borderWidth: 3
    }]
  } : null;

  const activityLineData = viewData ? {
    labels: viewData.chartDates,
    datasets: [
      {
        label: 'Clicks',
        data: viewData.chartData.map(d => d.clicks),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Keypresses',
        data: viewData.chartData.map(d => d.keys),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.15)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const barChartData = viewData ? {
    labels: viewData.chartDates,
    datasets: [{
      label: 'Mouse Distance (km)',
      data: viewData.chartData.map(d => d.distance),
      backgroundColor: '#475569',
      borderRadius: 8
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#DADBDD', font: { size: 12 } }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { size: 11 } },
        grid: { color: '#1f1b1b' }
      },
      y: {
        ticks: { color: '#9ca3af', font: { size: 11 } },
        grid: { color: '#1f1b1b' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#DADBDD', padding: 15, font: { size: 12 } }
      }
    }
  };

  if (error) {
    return (
      <div className="App">
        <header className="header">
          <h1>🖱️ Activity Tracker Dashboard</h1>
        </header>
        <div className="upload-container">
          <div className="upload-card">
            <div className="upload-icon">⚠️</div>
            <h2>Data Not Found</h2>
            <p>{error}</p>
            <p className="error-message">
              Error
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="App">
        <header className="header">
          <h1>🖱️ Activity Tracker Dashboard</h1>
        </header>
        <div className="upload-container">
          <div className="upload-card">
            <div className="upload-icon">⏳</div>
            <h2>Loading Data...</h2>
            <p>Fetching your activity stats</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1>🖱️ Activity Tracker Dashboard</h1>
          <div className="social-links">
            <a href="https://cablooo.github.io/cablo/" target="_blank" rel="noopener noreferrer" className="social-link">
              🌐 Website
            </a>
            <a href="https://x.com/T_cablo" target="_blank" rel="noopener noreferrer" className="social-link">
              𝕏 Twitter
            </a>
            <a href="https://github.com/cablooo" target="_blank" rel="noopener noreferrer" className="social-link">
              💻 GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="view-selector">
        <button
          className={view === 'daily' ? 'active' : ''}
          onClick={() => setView('daily')}
        >
          Today
        </button>
        <button
          className={view === 'weekly' ? 'active' : ''}
          onClick={() => setView('weekly')}
        >
          This Week
        </button>
        <button
          className={view === 'alltime' ? 'active' : ''}
          onClick={() => setView('alltime')}
        >
          All Time
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🖱️</div>
          <div className="stat-info">
            <h3>Total Clicks</h3>
            <p className="stat-value">{viewData.clicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⌨️</div>
          <div className="stat-info">
            <h3>Keypresses</h3>
            <p className="stat-value">{viewData.keys.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📏</div>
          <div className="stat-info">
            <h3>Mouse Distance</h3>
            <p className="stat-value">{viewData.distance}M px</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>Sessions</h3>
            <p className="stat-value">{viewData.sessions}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Click Distribution</h3>
          <div className="chart-container">
            <Doughnut data={clicksDistributionData} options={doughnutOptions} />
          </div>
        </div>

        <div className="chart-card large">
          <h3>Activity Over Time</h3>
          <div className="chart-container">
            <Line data={activityLineData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Mouse Movement</h3>
          <div className="chart-container">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;