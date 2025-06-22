import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BD4', '#FF66B3'];

const SAVINGS_GOAL = 1000;
const SHOPPING_LIMIT = 300;

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [newTransaction, setNewTransaction] = useState({
    type: 'Expense',
    category: '',
    amount: '',
    date: ''
  });

  const fetchTransactions = () => {
    fetch('http://localhost:4000/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    if (filter === 'All') return true;
    return t.type === filter;
  });

  const expenses = transactions.filter(t => t.type === 'Expense');
  const incomes = transactions.filter(t => t.type === 'Income');

  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const progress = Math.min((savings / SAVINGS_GOAL) * 100, 100);

  const shoppingAlert = expenses
    .filter(t => t.category.toLowerCase() === 'shopping')
    .reduce((s, t) => s + t.amount, 0) > SHOPPING_LIMIT;

  const groupedExpenses = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const chartData = Object.entries(groupedExpenses).map(([name, value]) => ({
    name,
    value
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const submitTransaction = (e) => {
    e.preventDefault();
    const data = {
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    };

    fetch('http://localhost:4000/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(() => {
        setNewTransaction({
          type: 'Expense',
          category: '',
          amount: '',
          date: ''
        });
        fetchTransactions();
      });
  };

  return (
    <div style={{ textAlign: 'center', margin: '20px' }}>
      <h2>Expense structure (by category)</h2>
      <PieChart width={400} height={400}>
        <Pie data={chartData} cx="50%" cy="50%" outerRadius={150} label dataKey="value">
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      <h3>Expense comparison (BarChart)</h3>
      <BarChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#00C49F" />
      </BarChart>

      <h3>Savings goal: {SAVINGS_GOAL} PLN</h3>
      <div style={{
        width: '60%', margin: '0 auto', height: '30px',
        border: '1px solid #aaa', borderRadius: '6px',
        background: '#eee', overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: '#00C49F', color: 'white',
          textAlign: 'center', lineHeight: '30px'
        }}>
          {Math.round(progress)}%
        </div>
      </div>

      {shoppingAlert && (
        <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>
          Budget exceeded in the "Shopping" category! (limit: {SHOPPING_LIMIT} PLN)
        </div>
      )}

      <h3>Filter transactions</h3>
      <div style={{ marginBottom: '20px' }}>
        {['All', 'Expense', 'Income'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              margin: '0 10px',
              padding: '8px 16px',
              background: filter === f ? '#0088FE' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <h3>Add new transaction</h3>
      <form onSubmit={submitTransaction} style={{ marginBottom: '30px' }}>
        <select name="type" value={newTransaction.type} onChange={handleChange}>
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>{' '}
        <input
          name="category"
          placeholder="Category"
          value={newTransaction.category}
          onChange={handleChange}
          required
        />{' '}
        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={newTransaction.amount}
          onChange={handleChange}
          required
        />{' '}
        <input
          name="date"
          type="date"
          value={newTransaction.date}
          onChange={handleChange}
          required
        />{' '}
        <button type="submit">Add</button>
      </form>

      <h3>All transactions</h3>
      <table style={{ margin: '0 auto', borderCollapse: 'collapse', minWidth: '60%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black' }}>ID</th>
            <th style={{ border: '1px solid black' }}>Type</th>
            <th style={{ border: '1px solid black' }}>Category</th>
            <th style={{ border: '1px solid black' }}>Amount</th>
            <th style={{ border: '1px solid black' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => (
            <tr key={t.id}>
              <td style={{ border: '1px solid black' }}>{t.id}</td>
              <td style={{ border: '1px solid black' }}>{t.type}</td>
              <td style={{ border: '1px solid black' }}>{t.category}</td>
              <td style={{ border: '1px solid black' }}>{t.amount}</td>
              <td style={{ border: '1px solid black' }}>{t.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
