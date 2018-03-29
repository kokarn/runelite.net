import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import Chart from 'chart.js'
import {Bar, Line} from 'react-chartjs-2'
import Layout from '../components/layout'
import hero from '../_data/hero'
import {Col, ListGroup, ListGroupItem, Row} from 'reactstrap'
import * as R from 'ramda'

Chart.defaults.options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 300
  },
  tooltips: {
    callbacks: {
      label: (tooltipItem) => numberWithCommas(tooltipItem.yLabel.toString())
    }
  }
}

const reverseGraphOptions = {
  scales: {
    yAxes: [{
      ticks: {
        reverse: true
      }
    }]
  }
}

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)
const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const highlightChangeValue = (value) => value >= 0
  ? (<span style={{color: 'green'}}>+{numberWithCommas(value)}</span>)
  : (<span style={{color: 'red'}}>{numberWithCommas(value)}</span>)

const skills = {
  agility: 'rgb(35, 37, 93)',
  attack: 'rgb(111, 31, 28)',
  construction: 'rgb(130, 119, 104)',
  cooking: 'rgb( 74, 27, 77)',
  crafting: 'rgb( 111, 84, 64)',
  defence: 'rgb( 94, 113, 163)',
  farming: 'rgb( 32, 84, 44)',
  firemaking: 'rgb( 163, 85, 34)',
  fishing: 'rgb( 105, 132, 153)',
  fletching: 'rgb( 0, 58, 60)',
  herblore: 'rgb( 0, 86, 27)',
  hitpoints: 'rgb( 156, 30, 24)',
  hunter: 'rgb( 94, 90, 67)',
  magic: 'rgb( 47, 49, 132)',
  mining: 'rgb( 84, 135, 153)',
  prayer: 'rgb( 159, 138, 47)',
  ranged: 'rgb( 130, 80, 45)',
  runecraft: 'rgb( 183, 159, 55)',
  slayer: 'rgb( 53, 48, 48)',
  smithing: 'rgb( 67, 67, 54)',
  strength: 'rgb( 0, 105, 72)',
  thieving: 'rgb( 102, 57, 83)',
  woodcutting: 'rgb( 113, 92, 57)'
}

const skillNames = Object.keys(skills)
const capitalizedSkills = Object.keys(skills).map(skill => capitalizeFirstLetter(skill))
const skillColors = Object.values(skills)

const calculateOverallXp = (xpEntry) => skillNames.map(skill => xpEntry[skill + '_xp'] || 0).reduce((a, b) => a + b, 0)

const calculateRanksAndExp = (collector) => (value, key) => {
  let curKey = key
  let isRank = true

  if (key.indexOf('_rank') !== -1) {
    curKey = key.replace('_rank', '')
    isRank = true
  } else if (key.indexOf('_xp') !== -1) {
    curKey = key.replace('_xp', '')
    isRank = false
  } else {
    return
  }

  const curObj = collector[curKey]

  if (isRank) {
    collector[curKey] = curObj ? {
      ...curObj,
      rank: value - curObj.rank
    } : {
      xp: 0,
      rank: value
    }
  } else {
    collector[curKey] = curObj ? {
      ...curObj,
      xp: value - curObj.xp
    } : {
      xp: value,
      rank: 0
    }
  }
}

const inverseOverallRank = (overallRankCollector) => {
  overallRankCollector.rank = -overallRankCollector.rank
  return overallRankCollector
}

const Xp = ({ children, xpRange: { name, start, end, xp } }) => {
  const xpWithOverall = xp.map(xpEntry => ({
    ...xpEntry,
    overall_xp: calculateOverallXp(xpEntry)
  }))

  const dates = xpWithOverall.map(xpEntry => xpEntry.date.toDateString())
  const startEntry = xpWithOverall[0]
  const endEntry = xpWithOverall[xpWithOverall.length - 1]
  const collector = {}

  R.forEachObjIndexed(calculateRanksAndExp(collector), startEntry)
  R.forEachObjIndexed(calculateRanksAndExp(collector), endEntry)

  const ranks = skillNames
    .map(name => ({
      img: name,
      ...(collector[name] ? collector[name] : {
        xp: 0,
        rank: 0
      })
    }))
    .sort()

  ranks.unshift({
    img: 'overall',
    ...(collector['overall'] ? inverseOverallRank(collector['overall']) : {
      xp: 0,
      rank: 0
    })
  })

  const overallRank = {
    labels: dates,
    datasets: [
      {
        label: 'Overall rank',
        backgroundColor: 'yellow',
        fill: false,
        data: xpWithOverall.map(xpEntry => xpEntry.overall_rank)
      }
    ]
  }

  const overallXp = {
    labels: dates,
    datasets: [{
      label: 'Total XP',
      backgroundColor: 'green',
      fill: false,
      data: xpWithOverall.map(xpEntry => xpEntry.overall_xp)
    }]
  }

  const allXp = {
    labels: capitalizedSkills,
    datasets: [{
      label: 'Experience gained',
      backgroundColor: skillColors,
      data: skillNames.map(skill => collector[skill] ? collector[skill].xp : 0)
    }]
  }

  const allRanks = {
    labels: capitalizedSkills,
    datasets: [{
      label: 'Ranks gained',
      backgroundColor: skillColors,
      data: skillNames.map(skill => collector[skill] ? collector[skill].rank : 0)
    }]
  }

  return (
    <div style={{height: 'inherit'}}>
      <Layout fullWidth>
        <Helmet>
          <title>Experience Tracker - {hero.title}</title>
        </Helmet>
        <h1>{name}</h1>
        <p className='text-muted'>{start ? start.toDateString() : ''} - {end ? end.toDateString() : ''}</p>
        <hr />
        <Row>
          <Col md='3' sm='4' xs='12'>
            <ListGroup>
              {ranks.map(({img, rank, xp}) => (
                <ListGroupItem key={img}>
                  <img alt={img} src={`/img/skillicons/${img}.png`} /> {capitalizeFirstLetter(img)}<br />
                  {highlightChangeValue(-rank)} ranks, {highlightChangeValue(xp)} xp
                </ListGroupItem>
              ))}
            </ListGroup>
          </Col>
          <Col md='9' sm='8' xs='12'>
            <Line data={overallRank} options={{reverseGraphOptions}} />
            <Line data={overallXp} />
            <Bar data={allXp} />
            <Bar data={allRanks} />
          </Col>
        </Row>
        {children}
      </Layout>
    </div>
  )
}

export default connect(
  (state) => ({
    xpRange: state.runelite
  })
)(Xp)
