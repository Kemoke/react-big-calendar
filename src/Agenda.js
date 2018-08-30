import PropTypes from 'prop-types'
import React from 'react'
import localizer from './localizer'
import message from './utils/messages'
import dates from './utils/dates'
import { navigate } from './utils/constants'
import { accessor as get } from './utils/accessors'
import { accessor, dateFormat, dateRangeFormat } from './utils/propTypes'
import { inRange } from './utils/eventLevels'

class Agenda extends React.Component {
  static propTypes = {
    events: PropTypes.array,
    date: PropTypes.instanceOf(Date),
    length: PropTypes.number.isRequired,
    titleAccessor: accessor.isRequired,
    tooltipAccessor: accessor.isRequired,
    allDayAccessor: accessor.isRequired,
    startAccessor: accessor.isRequired,
    endAccessor: accessor.isRequired,
    eventPropGetter: PropTypes.func,
    selected: PropTypes.object,

    agendaDateFormat: dateFormat,
    agendaTimeFormat: dateFormat,
    agendaTimeRangeFormat: dateRangeFormat,
    culture: PropTypes.string,

    components: PropTypes.object.isRequired,
    messages: PropTypes.shape({
      date: PropTypes.string,
      time: PropTypes.string,
    }),
  }

  static defaultProps = {
    length: 30,
  }
  getColor(event) {
    if (event.blockoff) return 'badge-info'
    else if (event.offtime) return 'badge-dark'
    else {
      switch (event) {
        case 'Confirmed':
          return 'badge-success'
        case 'Unconfirmed':
          return 'badge-warning'
        case 'No-Show':
          return 'badge-secondary'
        default:
          return 'badge-info'
      }
    }
  }
  render() {
    let { length, date, events, startAccessor } = this.props
    let messages = message(this.props.messages)
    let end = dates.add(date, length, 'day')

    let range = dates.range(date, end, 'day')

    events = events.filter(event => inRange(event, date, end, this.props))

    events.sort((a, b) => +get(a, startAccessor) - +get(b, startAccessor))
    return (
      <div className="rbc-agenda-view">
        <table ref="header" className="rbc-agenda-table">
          <thead>
            <tr>
              <th className="rbc-header" style={{ width: '15%' }}>
                {messages.date}
              </th>
              <th className="rbc-header" style={{ width: '15%' }}>
                {messages.time}
              </th>
              <th className="rbc-header" style={{ width: '20%' }}>
                Customer
              </th>
              <th className="rbc-header" style={{ width: '20%' }}>
                Phone Number
              </th>
              <th className="rbc-header" style={{ width: '20%' }}>
                Location
              </th>
              <th className="rbc-header" style={{ width: '10%' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody ref="tbody">
            {range.map((day, idx) => this.renderDay(day, events, idx))}
          </tbody>
        </table>
      </div>
    )
  }

  renderDay = (day, events, dayKey) => {
    let { culture, components, agendaDateFormat } = this.props

    let DateComponent = components.date

    events = events.filter(e =>
      inRange(e, dates.startOf(day, 'day'), dates.endOf(day, 'day'), this.props)
    )

    return events.map((event, idx) => {
      let dateLabel =
        idx === 0 && localizer.format(day, agendaDateFormat, culture)
      let first =
        idx === 0 ? (
          <td rowSpan={events.length}>
            {DateComponent ? (
              <DateComponent day={day} label={dateLabel} />
            ) : (
              dateLabel
            )}
          </td>
        ) : (
          false
        )
      return (
        <tr key={dayKey + '_' + idx}>
          {first}
          <td>{this.timeRangeLabel(day, event)}</td>
          <td>
            {event.customer
              ? event.customer.first_name + ' ' + event.customer.last_name
              : ''}
          </td>
          <td>{event.customer ? '+1' + event.customer.phone_number : ''}</td>
          <td>{event.address ? event.address : ''}</td>
          <td>
            <div className="text-center">
              {event.status ? (
                <span className={'badge ' + this.getColor(event)}>
                  {event.status}
                </span>
              ) : (
                <span className="badge badge-secondary">
                  {event.blockoff ? 'Block Time' : 'Off Time'}
                </span>
              )}
            </div>
          </td>
        </tr>
      )
    }, [])
  }

  timeRangeLabel = (day, event) => {
    let {
      endAccessor,
      startAccessor,
      allDayAccessor,
      culture,
      messages,
      components,
    } = this.props

    let labelClass = '',
      TimeComponent = components.time,
      label = message(messages).allDay

    let start = get(event, startAccessor)
    let end = get(event, endAccessor)

    if (!get(event, allDayAccessor)) {
      if (dates.eq(start, end, 'day')) {
        label = localizer.format(
          { start, end },
          this.props.agendaTimeRangeFormat,
          culture
        )
      } else if (dates.eq(day, start, 'day')) {
        label = localizer.format(start, this.props.agendaTimeFormat, culture)
      } else if (dates.eq(day, end, 'day')) {
        label = localizer.format(end, this.props.agendaTimeFormat, culture)
      }
    }

    if (dates.gt(day, start, 'day')) labelClass = 'rbc-continues-prior'
    if (dates.lt(day, end, 'day')) labelClass += ' rbc-continues-after'

    return (
      <span className={labelClass.trim()}>
        {TimeComponent ? (
          <TimeComponent event={event} day={day} label={label} />
        ) : (
          label
        )}
      </span>
    )
  }
}

Agenda.range = (start, { length = Agenda.defaultProps.length }) => {
  let end = dates.add(start, length, 'day')
  return { start, end }
}

Agenda.navigate = (date, action, { length = Agenda.defaultProps.length }) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -length, 'day')

    case navigate.NEXT:
      return dates.add(date, length, 'day')

    default:
      return date
  }
}

Agenda.title = (
  start,
  { length = Agenda.defaultProps.length, formats, culture }
) => {
  let end = dates.add(start, length, 'day')
  return localizer.format({ start, end }, formats.agendaHeaderFormat, culture)
}

export default Agenda
