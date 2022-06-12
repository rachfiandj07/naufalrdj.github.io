import "/assets/js/probability-distributions-bundle.js";

export const ticketWorkColors = d3.schemeSet3
  .slice(0, 2)
  .concat(d3.schemeSet3.slice(4, 8))
  .concat(d3.schemeSet3[11]);
const lunchColor = d3.schemeSet3[10];
const meetingColor = d3.schemeSet3[9];
const regressionTestingColor = d3.schemeSet3[3];
const contextSwitchColor = d3.schemeSet3[8];
const nothingColor = "#fff";

export function color(event) {
  if (event instanceof ScheduledTicketWork) {
    return ticketWorkColors[
      event.ticket.number % (ticketWorkColors.length - 1)
    ];
  } else if (event instanceof LunchBreak) {
    return lunchColor;
  } else if (event instanceof RegressionTesting) {
    return regressionTestingColor;
  } else if (event instanceof Meeting) {
    return meetingColor;
  } else if (event instanceof ContextSwitchEvent) {
    return contextSwitchColor;
  }
  return nothingColor;
}

export const workerIdentifierColors = [
  "#003f5c",
  "#2f4b7c",
  "#665191",
  "#a05195",
  "#d45087",
  "#f95d6a",
  "#ff7c43",
  "#ffa600",
];

export class Event {
  constructor(startTime, duration, day, title = null) {
    this.startTime = startTime;
    this.duration = duration;
    this.endTime = startTime + duration;
    this.day = day;
    this.rawStartDayTime = this.day * 480 + this.startTime;
    this.rawEndDayTime = this.rawStartDayTime + this.duration;
    this.title = title || this.title;
  }
  get color() {
    return d3.color(color(this));
  }
}

export class Meeting extends Event {
  relevantMinutes = ["meetingMinutes"];
}

class DailyStandup extends Meeting {
  title = "Daily Standup";
}

class SprintPlanning extends Meeting {
  title = "Sprint Planning";
}

class SprintRetro extends Meeting {
  title = "Sprint Retro";
}

export class RegressionTesting extends Event {
  relevantMinutes = ["regressionTestingMinutes"];
  title = "Regression Testing";
}

class NothingEvent extends Event {
  // Nothing is done during this period of time. This is solely used to make logic
  // easier, and is placed in a schedule when it's determined that no work can be done
  // because it will take too long to switch contexts and get anything productive
  // done.
  relevantMinutes = ["nothingMinutes"];
  title = "Nothing";
}

class ContextSwitchEvent extends Event {
  relevantMinutes = ["contextSwitchingMinutes"];
  title = "Context Switching";
  constructor(
    startTime,
    duration,
    ticket,
    firstIteration = true,
    lastIteration = true,
    day
  ) {
    super(startTime, duration, day);
    this.ticket = ticket;
    this.firstIteration = firstIteration;
    this.lastIteration = lastIteration;
  }
}

export class LunchBreak extends Meeting {
  // Extends Meeting because meetings can be stacked back to back without having to
  // worry about context switching between them, and when leading up to a meeting, if
  // the prior Event ended less than or equal to 30 minutes before it, then new work
  // won't be started. These are all true for Lunch as well.
  title = "Lunch";
}

class LunchAndLearn extends LunchBreak {
  // Just like lunch, except treated like a meeting. Can replace any instance of
  // lunch, provided it doesn't conflict.
  title = "Lunch & Learn";
}

export class ScheduledTicketWork extends Event {
  // ScheduledTicketWork is work for a ticket that either a programmer or tester is
  // doing. ScheduledTicketWork will always require up to 30 minutes after any prior
  // event in order to context switch. If 30 minutes or less would only be available
  // before the next event, then work on a new ticket won't be scheduled. But if work
  // was already being done on a ticket, an attempt to schedule some work will be made,
  // although it may be only enough to context switch before time runs out.
  constructor(
    startTime,
    duration,
    ticket,
    contextSwitchEvent,
    day,
    firstIteration = true,
    lastIteration = true
  ) {
    super(startTime, duration, day);
    this.ticket = ticket;
    this.contextSwitchEvent = contextSwitchEvent;
    this.firstIteration = firstIteration;
    this.lastIteration = lastIteration;
  }
}

class ScheduledCoreTicketWork extends ScheduledTicketWork {
  // This is exactly like ScheduledTicketWork, except it can't be placed in between a
  // prior event's end and a Meeting (even Lunch), if that next Meeting starts 30
  // minutes or less after the prior event.
}
export class ScheduledTicketProgrammingWork extends ScheduledTicketWork {
  title = "Programming Work";
}
export class ScheduledTicketCheckingWork extends ScheduledTicketWork {
  title = "Checking";
}
export class ScheduledTicketAutomationWork extends ScheduledTicketWork {
  title = "Automation";
}
export class ScheduledTicketCodeReviewWork extends ScheduledTicketWork {
  title = "Code Review";
}

class ScheduledCoreTicketProgrammingWork extends ScheduledTicketProgrammingWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "programmingMinutes",
    "productiveProgrammingTicketWorkMinutes",
  ];
}

class ScheduledCoreTicketCheckingWork extends ScheduledTicketCheckingWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "checkingMinutes",
    "productiveCheckingTicketWorkMinutes",
  ];
}
class ScheduledCoreTicketAutomationWork extends ScheduledTicketAutomationWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "automationMinutes",
    "productiveProgrammingTicketWorkMinutes",
  ];
}
class ScheduledCoreTicketCodeReviewWork extends ScheduledTicketCodeReviewWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "codeReviewMinutes",
    "productiveCodeReviewTicketWorkMinutes",
  ];
}

class ScheduledRedundantNewTicketProgrammingWork extends ScheduledCoreTicketProgrammingWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "programmingMinutes",
    "redundantProgrammingTicketWorkMinutes",
  ];
}
class ScheduledRedundantNewTicketCheckingWork extends ScheduledCoreTicketCheckingWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "checkingMinutes",
    "redundantCheckingTicketWorkMinutes",
  ];
}
// Not real because testers would be responsible in this system for making sure their
// checks work completely before committing them (ideally).
// class ScheduledRedundantNewTicketAutomationWork extends ScheduledCoreTicketAutomationWork {}
class ScheduledRedundantNewTicketCodeReviewWork extends ScheduledCoreTicketCodeReviewWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "codeReviewMinutes",
    "redundantCodeReviewTicketWorkMinutes",
  ];
}

class ScheduledCorePreviouslyInterruptedTicketProgrammingWork extends ScheduledTicketProgrammingWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "programmingMinutes",
    "productiveProgrammingTicketWorkMinutes",
  ];
}
class ScheduledCorePreviouslyInterruptedTicketCheckingWork extends ScheduledTicketCheckingWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "checkingMinutes",
    "productiveCheckingTicketWorkMinutes",
  ];
}
class ScheduledCorePreviouslyInterruptedTicketAutomationWork extends ScheduledTicketAutomationWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "automationMinutes",
    "productiveProgrammingTicketWorkMinutes",
  ];
}
class ScheduledCorePreviouslyInterruptedTicketCodeReviewWork extends ScheduledTicketCodeReviewWork {
  relevantMinutes = [
    "productiveTicketWorkMinutes",
    "codeReviewMinutes",
    "productiveCodeReviewTicketWorkMinutes",
  ];
}

class ScheduledRedundantPreviouslyInterruptedTicketProgrammingWork extends ScheduledCorePreviouslyInterruptedTicketProgrammingWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "programmingMinutes",
    "redundantProgrammingTicketWorkMinutes",
  ];
}
class ScheduledRedundantPreviouslyInterruptedTicketCheckingWork extends ScheduledCorePreviouslyInterruptedTicketCheckingWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "checkingMinutes",
    "redundantCheckingTicketWorkMinutes",
  ];
}
// Not real because testers would be responsible in this system for making sure their
// checks work completely before committing them (ideally).
// class ScheduledRedundantPreviouslyInterruptedTicketAutomationWork extends ScheduledCorePreviouslyInterruptedTicketAutomationWork {}
class ScheduledRedundantPreviouslyInterruptedTicketCodeReviewWork extends ScheduledCorePreviouslyInterruptedTicketCodeReviewWork {
  relevantMinutes = [
    "redundantTicketWorkMinutes",
    "codeReviewMinutes",
    "redundantCodeReviewTicketWorkMinutes",
  ];
}

const redundantEvents = [
  ScheduledRedundantNewTicketProgrammingWork,
  ScheduledRedundantNewTicketCheckingWork,
  ScheduledRedundantNewTicketCodeReviewWork,
  ScheduledRedundantPreviouslyInterruptedTicketProgrammingWork,
  ScheduledRedundantPreviouslyInterruptedTicketCheckingWork,
  ScheduledRedundantPreviouslyInterruptedTicketCodeReviewWork,
];

class ScheduledCorePreviouslyInterruptedTicketWork extends ScheduledTicketWork {
  // Represents follow-up work for a work iteration that was interrupted and context
  // had to be re-acquired.
}

class AvailableTimeSlot {
  constructor(nextEventIndex, startTime, endTime) {
    this.nextEventIndex = nextEventIndex;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = endTime - startTime;
  }
  get previousMeetingIndex() {
    return [null, 0].includes(this.nextEventIndex)
      ? null
      : this.nextEventIndex - 1;
  }
}

class DaySchedule {
  constructor(lunchTime, day) {
    this.day = day;
    this.items = [];
    this.lastMeetingIndexBeforeAvailability = null;
    this.availableTimeSlots = [new AvailableTimeSlot(null, 0, 480)];
    let lunch = new LunchBreak(lunchTime, 60, this.day);
    this.scheduleMeeting(lunch);
  }

  scheduleMeeting(event) {
    // assumes events are set first and were set in order
    if (this.availableTimeSlots.length === 0) {
      throw Error("No available time to schedule events");
    }
    const newAvailableTimeSlots = [];
    // track the number of events added so that NothingEvents can also impact the
    // later AvailableTimeSlot's nextEventIndex attribute.
    let eventsAdded = 0;
    let matchingTimeSlotIndex = 0;
    for (
      let timeSlotIndex = 0;
      timeSlotIndex < this.availableTimeSlots.length;
      timeSlotIndex++
    ) {
      const timeSlot = this.availableTimeSlots[timeSlotIndex];
      if (
        !eventsAdded &&
        event.startTime >= timeSlot.startTime &&
        event.endTime <= timeSlot.endTime
      ) {
        // event fits here
        matchingTimeSlotIndex = timeSlotIndex;

        // Add possible NothingEvent to schedule items, or AvailableTimeSlot to schedule's available time slots.
        const startTimeDiff = event.startTime - timeSlot.startTime;
        if (startTimeDiff > 0) {
          if (startTimeDiff <= 30) {
            // just enough time to do nothing
            const newNothingEvent = new NothingEvent(
              timeSlot.startTime,
              startTimeDiff,
              this.day
            );
            if (timeSlot.nextEventIndex === null) {
              this.items.push(newNothingEvent);
            } else {
              this.items.splice(timeSlot.nextEventIndex, 0, newNothingEvent);
            }
            eventsAdded += 1;
          } else {
            let newTimeSlotNextEventIndex;
            if (timeSlot.nextEventIndex === null) {
              newTimeSlotNextEventIndex = this.items.length;
            } else {
              newTimeSlotNextEventIndex = timeSlot.nextEventIndex;
            }
            newAvailableTimeSlots.push(
              new AvailableTimeSlot(
                newTimeSlotNextEventIndex,
                timeSlot.startTime,
                event.startTime
              )
            );
          }
        }

        // add event to schedule items
        if (timeSlot.nextEventIndex === null) {
          this.items.push(event);
        } else {
          this.items.splice(timeSlot.nextEventIndex + eventsAdded, 0, event);
        }
        eventsAdded += 1;

        // Add possible NothingEvent to schedule items, or AvailableTimeSlot to schedule's available time slots.
        const endTimeDiff = timeSlot.endTime - event.endTime;
        if (endTimeDiff > 0) {
          if (endTimeDiff <= 30 && !(event instanceof ContextSwitchEvent)) {
            // just enough time to do nothing
            const newNothingEvent = new NothingEvent(
              event.endTime,
              endTimeDiff,
              this.day
            );
            if (timeSlot.nextEventIndex === null) {
              this.items.push(newNothingEvent);
            } else {
              this.items.splice(
                timeSlot.nextEventIndex + eventsAdded,
                0,
                newNothingEvent
              );
            }
            eventsAdded += 1;
          } else {
            // still room to do something (or the next thing being scheduled will be the ticket work)
            let newTimeSlotNextEventIndex;
            if (timeSlot.nextEventIndex === null) {
              newTimeSlotNextEventIndex = null;
            } else {
              newTimeSlotNextEventIndex = timeSlot.nextEventIndex + eventsAdded;
            }
            newAvailableTimeSlots.push(
              new AvailableTimeSlot(
                newTimeSlotNextEventIndex,
                event.endTime,
                timeSlot.endTime
              )
            );
          }
        }
      }
    }
    if (!eventsAdded) {
      // event conflicts
      throw Error("Event conflicts with another event");
    }
    // update remaining time slots so they're `nextEventIndex` properties are increased
    // as necessary, based on the number of events added
    for (
      let i = matchingTimeSlotIndex + 1;
      i < this.availableTimeSlots.length;
      i++
    ) {
      const timeSlot = this.availableTimeSlots[i];
      if (timeSlot.nextEventIndex !== null) {
        timeSlot.nextEventIndex += eventsAdded;
      }
    }
    // Merge in newly defined AvailableTimeSlots if applicable.
    this.availableTimeSlots.splice(
      matchingTimeSlotIndex,
      1,
      ...newAvailableTimeSlots
    );
  }
}

class NoAvailableTimeSlotsError extends Error {
  constructor(...params) {
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoAvailableTimeSlotsError);
    }

    this.name = "NoAvailableTimeSlotsError";
  }
}

class Schedule {
  constructor(
    sprintDayCount,
    regressionTestDayCount,
    lunchTime,
    customEventsByDay
  ) {
    // The "first" ${regressionTestDayCount} days of the sprint are actually
    // the last days of the previous sprint when the tester is doing the
    // regression tests, and it is assumed that the programmers are getting
    // a head start on next sprint, and are only working on tickets for that
    // next sprint. Their work is simulated for these days both to reflect
    // that programmers would normally be continuing work during this time,
    // but also so that the tester's schedule starts out on the first day of
    // the sprint with ticket work to do. Metrics will be gathered for all
    // days, even those from the last days of the previous sprint to reflect
    // the impact of this process from a holistic perspective.
    this.daySchedules = [];
    this.dayLengthInMinutes = 480;
    this.sprintDayCount = sprintDayCount;
    this.regressionTestDayCount = regressionTestDayCount;
    this.customEventsByDay = customEventsByDay;
    for (
      let i = 0;
      i < this.sprintDayCount + this.regressionTestDayCount;
      i++
    ) {
      const customEvents = this.customEventsByDay[i];
      let schedule = new DaySchedule(lunchTime, i);
      for (const event of customEvents) {
        schedule.scheduleMeeting(event);
      }
      if (i === regressionTestDayCount) {
        // first actual day of sprint, so sprint planning
        let remainingDuration = 120;
        while (remainingDuration > 0) {
          const availableDuration = schedule.availableTimeSlots[0].duration;
          let nextEventDuration = remainingDuration - availableDuration;
          if (nextEventDuration <= 0) {
            nextEventDuration = remainingDuration;
          }
          remainingDuration -= nextEventDuration;
          schedule.scheduleMeeting(
            new SprintPlanning(
              schedule.availableTimeSlots[0].startTime,
              nextEventDuration,
              i
            )
          );
        }
      } else {
        schedule.scheduleMeeting(new DailyStandup(0, 15, i));
      }
      this.daySchedules.push(schedule);
    }
    const lastHourOfDay = this.dayLengthInMinutes - 60;
    this.daySchedules[regressionTestDayCount - 1].scheduleMeeting(
      new SprintRetro(lastHourOfDay, 60, regressionTestDayCount - 1)
    );
    this.daySchedules[this.daySchedules.length - 1].scheduleMeeting(
      new SprintRetro(lastHourOfDay, 60, this.daySchedules.length - 1)
    );
    this.dayOfNextWorkIterationCompletion = null;
    this.timeOfNextWorkIterationCompletion = null;
    this.lastTicketWorkedOn = null;
  }

  get earliestAvailableDayForWorkIndex() {
    for (let i in this.daySchedules) {
      if (this.daySchedules[i].availableTimeSlots.length > 0) {
        return parseInt(i);
      }
    }
    return -1;
  }

  get earliestAvailableDayScheduleForWork() {
    if (this.earliestAvailableDayForWorkIndex === -1) {
      return null;
    }
    return this.daySchedules[this.earliestAvailableDayForWorkIndex];
  }

  addWork(ticket) {
    // assumes the meetings have already been defined and that work is being added
    // in the earliest available, viable time slot.
    this.lastTicketWorkedOn = ticket;
    let queue = this.getWorkIterationQueueFromTicket(ticket);
    let workIteration = queue.shift();
    this.copyOfLastWorkIterationTime = workIteration.time;
    let needsCodeReview = !!ticket.needsCodeReview;
    let needsAutomation = !!ticket.needsAutomation;
    let firstIteration = ticket.firstIteration;
    let finalIteration = !queue.length;
    let lastWorkEvent;
    if (workIteration.time === 0) {
      throw new Error("Got work iteration with no time");
    }
    while (workIteration.time > 0) {
      // work has a potential of being completed on the currently considered day,
      // but if it isn't, this.earliestAvailableDayForWorkIndex will be updated to
      // the next day that the work for this ticket could possibly be completed on
      // and when this iterates through again, it will possibly be correct. This
      // will repeat until eventually it is correct because
      // this.earliestAvailableDayForWorkIndex will have been the day that the
      // last of the work for this work iteration would be scheduled.
      this.dayOfNextWorkIterationCompletion = this.earliestAvailableDayForWorkIndex;
      if (this.earliestAvailableDayForWorkIndex === -1) {
        throw RangeError(
          "Not enough time left in the sprint to finish this ticket"
        );
      }
      let schedule = this.earliestAvailableDayScheduleForWork;
      let contextSwitchTime = Math.round(Math.random() * (30 - 10) + 10);
      let contextSwitchEvent = new ContextSwitchEvent(
        schedule.availableTimeSlots[0].startTime,
        contextSwitchTime,
        ticket,
        firstIteration,
        finalIteration,
        this.earliestAvailableDayForWorkIndex
      );
      schedule.scheduleMeeting(contextSwitchEvent);
      let newWorkEvent;
      // distinguish between interrupted work, and non-interrupted work
      let scheduledWorkClass;
      if (needsCodeReview) {
        if (finalIteration) {
          // This is the last time this ticket will need to be code reviewed, so it
          // isn't redundant.
          scheduledWorkClass = workIteration.started
            ? ScheduledCorePreviouslyInterruptedTicketCodeReviewWork
            : ScheduledCoreTicketCodeReviewWork;
        } else {
          // This code review will have to be done again in the future, making it
          // redundant.
          scheduledWorkClass = workIteration.started
            ? ScheduledRedundantPreviouslyInterruptedTicketCodeReviewWork
            : ScheduledRedundantNewTicketCodeReviewWork;
        }
      } else if (needsAutomation) {
        scheduledWorkClass = workIteration.started
          ? ScheduledCorePreviouslyInterruptedTicketAutomationWork
          : ScheduledCoreTicketAutomationWork;
      } else {
        if (this instanceof QaSchedule) {
          if (finalIteration) {
            // this is the last time this ticket will need to be checked, as it will be
            // checked successfully, in full, meaning it isn't redundant.
            scheduledWorkClass = workIteration.started
              ? this.scheduledCorePreviouslyInterruptedTicketWork
              : this.scheduledCoreTicketWork;
          } else {
            // The tester will only get part way through their checks for this ticket
            // before something goes wrong and they have to send it back, meaning the
            // next time they check this ticket, they'll have to repeat everything they
            // already did, so this work is redundant (even if the tester never gets to
            // finish checking this ticket successfully this sprint).
            scheduledWorkClass = workIteration.started
              ? this.scheduledRedundantPreviouslyInterruptedTicketWork
              : this.scheduledRedundantNewTicketWork;
          }
        } else if (this instanceof ProgrammerSchedule) {
          if (firstIteration) {
            // this is the first time the programmer will have worked on the ticket, and
            // what they send to code review after this will be something they believe
            // is worthy of going to production, making this work not redundant.
            scheduledWorkClass = workIteration.started
              ? this.scheduledCorePreviouslyInterruptedTicketWork
              : this.scheduledCoreTicketWork;
          } else {
            // The programmer is fixing their initial work, which would've ideally been
            // working fine before sending it to code review, making this redundant
            // work.
            scheduledWorkClass = workIteration.started
              ? this.scheduledRedundantPreviouslyInterruptedTicketWork
              : this.scheduledRedundantNewTicketWork;
          }
        } else {
          // unknown circumstances
          throw Error("Unrecognized worker schedule");
        }
      }
      workIteration.started = true;
      if (schedule.availableTimeSlots[0].duration >= workIteration.time) {
        // enough time to complete the iteration
        newWorkEvent = new scheduledWorkClass(
          contextSwitchEvent.endTime,
          workIteration.time,
          ticket,
          contextSwitchEvent,
          this.earliestAvailableDayForWorkIndex,
          firstIteration,
          finalIteration
        );
        this.timeOfNextWorkIterationCompletion = newWorkEvent.endTime;
      } else {
        // not enough time to complete the iteration
        newWorkEvent = new scheduledWorkClass(
          contextSwitchEvent.endTime,
          schedule.availableTimeSlots[0].duration,
          ticket,
          contextSwitchEvent,
          this.earliestAvailableDayForWorkIndex,
          firstIteration,
          finalIteration
        );
      }
      workIteration.time -= newWorkEvent.duration;
      schedule.scheduleMeeting(newWorkEvent);
      lastWorkEvent = newWorkEvent;
    }
    // Because of how the logic works, the ticket's
    // 'needsCodeReview'/'needsAutomation' status may be misleading during a
    // simulation. The ticket's 'needsCodeReview'/'needsAutomation'
    // status is set to true immediately after the work iteration for that ticket was
    // scheduled, or set to false immediately after the work iteration for code
    // review/checking was scheduled. So if a programmer grabbed a ticket to code
    // review it changes at 001, and it would take them until 030 to finish, the work
    // would be scheduled when the simulation is at 001, and the 'needsCodeReview'
    // status of the ticket would be set to false, even though the simulation would
    // still be at 001. This works similarly for a tester doing checking.
    //
    // Because of this, be mindful of the point in the iteration of the
    // simulation loop that this information is being queried at. For logging
    // the stack, this is done at the beginning of the iteration before any new
    // scheduling of work occurs (to better indicate the boundaries of when the
    // stacks changed). So if a ticket that a programmer was working on at that
    // moment had 'needsCodeReview' set to false, it would mean that that
    // programmer was doing code review on that ticket, rather than writing the
    // code for it.
    if (this instanceof ProgrammerSchedule) {
      // If the Programmer just finished scheduling the changes for this ticket,
      // then the ticket will need to be code reviewed by another programmer. If
      // a programmer just code reviewed it, it should be set to false and then
      // passed to QA. If QA needs to send it back to the original programmer,
      // then it staying set to false will make sure that code review work isn't
      // scheduled by mistake.
      ticket.needsCodeReview = !needsCodeReview;
    }
    if (this instanceof QaSchedule && finalIteration) {
      // final check has just been completed
      ticket.needsAutomation = !needsAutomation;
    }
    if (lastWorkEvent) {
      return lastWorkEvent.day * 480 + lastWorkEvent.endTime;
    }
    return false;
  }
}

class ProgrammerSchedule extends Schedule {
  scheduledCoreTicketWork = ScheduledCoreTicketProgrammingWork;
  scheduledRedundantNewTicketWork = ScheduledRedundantNewTicketProgrammingWork;
  scheduledCorePreviouslyInterruptedTicketWork = ScheduledCorePreviouslyInterruptedTicketProgrammingWork;
  scheduledRedundantPreviouslyInterruptedTicketWork = ScheduledRedundantPreviouslyInterruptedTicketProgrammingWork;
  getWorkIterationQueueFromTicket(ticket) {
    if (ticket.needsCodeReview) {
      return ticket.programmerCodeReviewWorkIterations;
    }
    return ticket.programmerWorkIterations;
  }
}

class QaSchedule extends Schedule {
  scheduledCoreTicketWork = ScheduledCoreTicketCheckingWork;
  scheduledRedundantNewTicketWork = ScheduledRedundantNewTicketCheckingWork;
  scheduledCorePreviouslyInterruptedTicketWork = ScheduledCorePreviouslyInterruptedTicketCheckingWork;
  scheduledRedundantPreviouslyInterruptedTicketWork = ScheduledRedundantPreviouslyInterruptedTicketCheckingWork;
  constructor(
    sprintDayCount,
    regressionTestDayCount,
    lunchTime,
    customEventsByDay
  ) {
    super(sprintDayCount, regressionTestDayCount, lunchTime, customEventsByDay);
    for (let i = 0; i < regressionTestDayCount; i++) {
      let previousSprintDaySchedule = this.daySchedules[i];
      let currentSprintI =
        this.daySchedules.length - (regressionTestDayCount - i);
      let currentSprintDaySchedule = this.daySchedules[currentSprintI];
      // regression tests from previous sprint
      while (previousSprintDaySchedule.availableTimeSlots.length > 0) {
        const timeSlot = previousSprintDaySchedule.availableTimeSlots[0];
        previousSprintDaySchedule.scheduleMeeting(
          new RegressionTesting(timeSlot.startTime, timeSlot.duration, i)
        );
      }
      while (currentSprintDaySchedule.availableTimeSlots.length > 0) {
        const timeSlot = currentSprintDaySchedule.availableTimeSlots[0];
        currentSprintDaySchedule.scheduleMeeting(
          new RegressionTesting(
            timeSlot.startTime,
            timeSlot.duration,
            i + this.sprintDayCount
          )
        );
      }
    }
  }
  getWorkIterationQueueFromTicket(ticket) {
    if (ticket.needsAutomation) {
      return ticket.automationWorkIterations;
    }
    return ticket.testerWorkIterations;
  }
}

class Worker {
  constructor(
    sprintDayCount,
    regressionTestDayCount,
    lunchTime,
    customEventsByDay
  ) {
    this.tickets = [];
    this.sprintDayCount = sprintDayCount;
    this.regressionTestDayCount = regressionTestDayCount;
    this.lunchTime = lunchTime;
    this.customEventsByDay = customEventsByDay;
    this.nextWorkIterationCompletionCheckIn = null;

    // These arrays track the minutes in the dayTime format (e.g. 1455 for day 4 at
    // 10AM), which will be useful for determining how much time was spent on
    // a particular event type up to a certain dayTime, because the index of that
    // dayTime (plus 1) will be the total amount of minutes spent doing that kind of
    // event up until that dayTime. An optimized binary search (possibly changing
    // for each event type for better performance) can be used to efficiently find
    // a given dayTime, using techniques such as setting the given dayTime as the
    // search's upper bound index (after subtracting the time for regression tests,
    // as those minutes from the previous sprint aren't tracked).
    //
    // If the searched for time doesn't match a minute that was tracked (e.g. a
    // dayTime of 1678 was searched for to find meeting minutes, but on meetings
    // were happening at that time), then the search algorithm can just round down
    // to the closest minute that it can find, which makes searching still cheap.
    //
    // This simulation requires the regression test period from the previous sprint
    // to also be simulated (as it reflects real scenarios and creates a basis of
    // available work so QA can start on tickets on the first day of the observed
    // sprint), and those minutes are counted to show how this process affects
    // things from a holistic perspective.
    this.contextSwitchingMinutes = [];
    this.meetingMinutes = [];
    this.productiveTicketWorkMinutes = [];
    this.redundantTicketWorkMinutes = [];
    this.programmingMinutes = [];
    this.productiveProgrammingTicketWorkMinutes = [];
    this.redundantProgrammingTicketWorkMinutes = [];
    this.codeReviewMinutes = [];
    this.productiveCodeReviewTicketWorkMinutes = [];
    this.redundantCodeReviewTicketWorkMinutes = [];
    // TODO: This array tracks minutes that were spent recovering from an interruption,
    // other than Lunch, and an end of day that was reached without going through a
    // meeting. So if the day ended with SprintRetro, and the worker was in the
    // middle of a work iteration, the ContextSwitchEvent before they began work on
    // that work iteration would count towards this, as would a meeting in the
    // middle of the day. This may not be immediately relevant, but may come in
    // handy if other meetings are implemented.
    this.productivityRecoveryMinutes = [];
    this.checkingMinutes = [];
    this.fluffCheckingMinutes = [];
    this.nonFluffCheckingMinutes = [];
    this.productiveCheckingTicketWorkMinutes = [];
    this.redundantCheckingTicketWorkMinutes = [];
    this.regressionTestingMinutes = [];
    this.automationMinutes = [];
    // Time spent doing nothing because there was no time to get started on anything
    // before a meeting, lunch, or the end of the day came up.
    this.nothingMinutes = [];

    this.initializeSchedule();
    this.minutesGenerated = false;
  }
  processEventMinutes() {
    // Called at the end of the simulation, as the events will all be added and this
    // can most efficiently iterate over them to determine the minutes and load them
    // into the minute arrays.
    for (let day of this.schedule.daySchedules) {
      for (let event of day.items) {
        // generates range of numbers representing the duration of the event for
        // the time range it took place. A 1 is added in the mapping to reflect
        // how the information would be queried for. A meeting can start at
        // dayTime 0, but if that dayTime is queried for, the response should be
        // 0 minutes. The index of the timestamp plus 1 represents the number of
        // minutes of the cumulative duration of events of that type.
        let eventMinutes = [...Array(event.duration).keys()].map(
          (i) => i + event.rawStartDayTime + 1
        );
        for (let category of event.relevantMinutes) {
          this[category].push(...eventMinutes);
        }
        if (this instanceof Tester) {
          if (event.relevantMinutes.includes("checkingMinutes")) {
            if (event.ticket.unfinished) {
              this.fluffCheckingMinutes.push(...eventMinutes);
            } else {
              this.nonFluffCheckingMinutes.push(...eventMinutes);
            }
          }
        }
      }
    }
    this.minutesGenerated = true;
  }
  getMeetingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.meetingMinutes, dayTime);
  }
  getContextSwitchingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.contextSwitchingMinutes,
      dayTime
    );
  }
  getProductiveTicketWorkMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.productiveTicketWorkMinutes,
      dayTime
    );
  }
  getRedundantTicketWorkMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.redundantTicketWorkMinutes,
      dayTime
    );
  }
  getCodeReviewMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.codeReviewMinutes, dayTime);
  }
  getProductiveCodeReviewMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.productiveCodeReviewTicketWorkMinutes,
      dayTime
    );
  }
  geRedundantCodeReviewMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.redundantCodeReviewTicketWorkMinutes,
      dayTime
    );
  }
  getProgrammingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.programmingMinutes, dayTime);
  }
  getProductiveProgrammingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.productiveProgrammingTicketWorkMinutes,
      dayTime
    );
  }
  geRedundantProgrammingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.redundantProgrammingTicketWorkMinutes,
      dayTime
    );
  }
  getCheckingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.checkingMinutes, dayTime);
  }
  getFluffCheckingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.fluffCheckingMinutes, dayTime);
  }
  getNonFluffCheckingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.nonFluffCheckingMinutes,
      dayTime
    );
  }
  getProductiveCheckingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.productiveCheckingTicketWorkMinutes,
      dayTime
    );
  }
  geRedundantCheckingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.redundantCheckingTicketWorkMinutes,
      dayTime
    );
  }
  getProductivityRecoveryMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.productivityRecoveryMinutes,
      dayTime
    );
  }
  getRegressionTestingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(
      this.regressionTestingMinutes,
      dayTime
    );
  }
  getAutomationMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.automationMinutes, dayTime);
  }
  getNothingMinutesAtDayTime(dayTime) {
    return this.getMinutesOfTypeAtDayTime(this.nothingMinutes, dayTime);
  }
  getMinutesOfTypeAtDayTime(minutesArr, dayTime) {
    // binary search
    //
    // Finds the index of the dayTime, or the index representing a dayTime that's
    // the closest to the desired dayTime without going over. The index of that
    // dayTime represents the number of minutes spent on that particular type up to
    // that point in time.
    if (!this.minutesGenerated) {
      this.processEventMinutes();
    }
    if (minutesArr.length === 0) {
      return 0;
    }

    let ceilingIndex = Math.min(dayTime, minutesArr.length) - 1;
    let ceilingValue = minutesArr[ceilingIndex];
    if (ceilingValue <= dayTime) {
      // rule out the initial ceiling value to make the while loop more efficient.
      // If it's ruled out here, the loop can assume that at some point, the
      // ceilingIndex will have been a currentIndex in a previous iteration.
      return ceilingIndex + 1;
    }

    let floorIndex = 0;
    let floorValue = minutesArr[floorIndex];
    if (floorValue > dayTime) {
      return 0;
    } else if (floorValue === dayTime) {
      return 1;
    }
    while (true) {
      let currentIndex = Math.round((floorIndex + ceilingIndex) / 2);
      let foundTime = minutesArr[currentIndex];
      if (foundTime === dayTime) {
        return currentIndex + 1;
      }
      if (foundTime < dayTime) {
        if (ceilingIndex - currentIndex === 1) {
          // either the currentIndex or the ceilingIndex points at the
          // appropriate minute count, and the ceilingIndex was either ruled
          // out before the loop, or in a previous iteration.
          return currentIndex + 1;
        }
        // shift right to the next iteration
        floorIndex = currentIndex;
        continue;
      }
      // foundTime must be greater than the dayTime, but the dayTime must also be
      // greater than the floorValue
      if (currentIndex - floorIndex === 1) {
        // the floorIndex is the only index representing the closest minute to
        // the dayTime without going over
        return floorIndex + 1;
      }
      // shift left to the next iteration
      ceilingIndex = currentIndex;
      continue;
    }
  }
  clearSchedule() {
    delete this.schedule;
    this.initializeSchedule();
  }
  addTicket(ticket) {
    if (!this.tickets.includes(ticket)) {
      this.tickets.push(ticket);
    }
  }
  get nextCheckInTime() {
    // The next time this worker should be checked in on, either because they would
    // have just finished working on an iteration of a ticket, or they would have
    // time available to work then.
    let iterationCompleteCheckIn = this.nextWorkIterationCompletionCheckIn;
    let availabilityCheckIn = this.nextAvailabilityCheckIn;
    if (iterationCompleteCheckIn === null) {
      // work hasn't been added yet, so there isn't a need to check for completed
      // work, and this can defer to the availability
      return availabilityCheckIn;
    }
    // there is a chance that earliest day/time may be -1, but that would mean
    // that there's no time left in the sprint, so there'd be no reason to check
    // in on this worker. As a result, this evaluating to a negative number is
    // expected as it can be used in other contexts.
    return Math.min(iterationCompleteCheckIn, availabilityCheckIn);
  }

  get nextAvailabilityCheckIn() {
    // The return value is in minutes, but each day prior is multiplied by 480 (the
    // number of minutes in a day) and then added to the minutes. So if the next
    // check-in time should be on the 5th day (which is actually the 4th because of
    // zero indexing) at the 332 minute, that would be (4 * 480) + 332.
    //
    // If needed, the day can be found again by dividing by 480 and then rounding
    // down.
    let earliestDayIndex = this.schedule.earliestAvailableDayForWorkIndex;
    if (earliestDayIndex < 0) {
      return -1;
    }
    let earliestTime = this.schedule.daySchedules[earliestDayIndex]
      .availableTimeSlots[0].startTime;
    return earliestTime + earliestDayIndex * 480;
  }
}

export class Programmer extends Worker {
  initializeSchedule() {
    this.schedule = new ProgrammerSchedule(
      this.sprintDayCount,
      this.regressionTestDayCount,
      this.lunchTime,
      this.customEventsByDay,
      this
    );
  }
}

export class Tester extends Worker {
  initializeSchedule() {
    this.schedule = new QaSchedule(
      this.sprintDayCount,
      this.regressionTestDayCount,
      this.lunchTime,
      this.customEventsByDay,
      this
    );
  }
}

class WorkIteration {
  constructor(time) {
    this.time = time;
    this.started = false;
  }
}

class Ticket {
  constructor(
    number,
    priority,
    programmerWorkIterations,
    programmerCodeReviewWorkIterations,
    testerWorkIterations,
    qaAutomationIteration,
    totalTimesToBeSentBack
  ) {
    // the ticket number used to uniquely identify it
    this.number = number;
    // the ticket's importance represented as a number. The lower the number, the
    // higher the priority
    this.priority = priority;
    // an array of amounts of uninterrupted time it will take the programmer to
    // complete an iteration of the ticket's implementation before sending it off to
    // QA
    this.programmerWorkIterations = programmerWorkIterations;
    this.programmerCodeReviewWorkIterations = programmerCodeReviewWorkIterations;
    // The amount of uninterrupted time it will take the tester to manually test the
    // ticket
    this.testerWorkIterations = testerWorkIterations;
    // The amount of uninterrupted time it will take the tester to write the
    // high-level automated tests for this ticket
    this.automationWorkIterations = [qaAutomationIteration];
    // The amount of times this ticket would have to be sent back to the programmer
    // before it would be completed.
    this.totalTimesToBeSentBack = totalTimesToBeSentBack;
    this.initialProgrammerWorkIterationTime = this.programmerWorkIterations[0].time;
    this.initialProgrammerCodeReviewWorkIterationTime = this.programmerCodeReviewWorkIterations[0].time;
    this.fullTesterWorkIterationTime = this.testerWorkIterations[
      this.testerWorkIterations.length - 1
    ].time;
    this.initialTesterAutomationWorkIterationTime = this.automationWorkIterations[0].time;
    // After the programmer has done work on the ticket, it will need code review
    // before being passed off to QA. Only once that work is done (or at least
    // scheduled) is this set to true.
    this.needsCodeReview = false;
    this.needsAutomation = false;
    // Whether or not any work has begun on this ticket or not. Used to track
    // metrics relating to work that was done in repeated iterations of work for
    // tickets needed. For programmers, this means any work iteration that wasn't
    // the very first for the ticket. For testers, this means any iteration that
    // wasn't the last iteration.
    this.fresh = true;
    this.unfinished = true;
  }
}

class TicketFactory {
  // start the number off higher than 0 to make it more interesting
  startingTicketNumber = 100;
  constructor(
    maxInitialProgrammerWorkTimeInHours = 16,
    maxFullRunTesterWorkTimeInHours = 8,
    maxQaAutomationTime = 8,
    averagePassBackCount = 1
  ) {
    // maxInitialProgrammerWorkTimeInHours is the time it takes for the programmer to
    // write the initial implementation that they believe meets the ticket's criteria.
    //
    // maxFullRunTesterWorkTimeInHours is the time it would take the tester to
    // completely run through the tests they have for a ticket, assuming everything is
    // working.
    //
    // They are phrased and treated differently, because the programmer does everything
    // in one iteration, and then refines in later iterations, but the tester can't do
    // everything in one go if something is wrong, and can only do the full run in one
    // shot if everything is working. So the programmer's likely highest iteration time
    // will be on their first iteration, while the tester's likely highest iteration
    // time will be on their last iteration.
    this.maxInitialProgrammerWorkTimeInHours = maxInitialProgrammerWorkTimeInHours;
    this.maxFullRunTesterWorkTimeInHours = maxFullRunTesterWorkTimeInHours;
    this.maxQaAutomationTime = maxQaAutomationTime;
    this.averagePassBackCount = averagePassBackCount;
    this.maxCodeReviewTimeInHours = 1;
    this.ticketsMade = 0;
  }
  generateTicket() {
    const initialProgrammerWorkTime = this.generateInitialProgrammerWorkTime();
    const fullRunTesterWorkTime = this.generateFullRunTesterWorkTime();
    const fullRunCodeReviewWorkTime = this.generateCodeReviewWorkIterationTime();
    const programmerWorkIterations = [initialProgrammerWorkTime];
    const testerWorkIterations = [];
    const programmerCodeReviewWorkIterations = [];
    const passBackCount = this.generateTicketPassBackCount();
    programmerWorkIterations.push(
      ...this.sampleFixWorkIterationTime(
        initialProgrammerWorkTime,
        passBackCount
      )
    );
    programmerCodeReviewWorkIterations.push(
      ...this.sampleFixCodeReviewWorkIterationTime(
        fullRunCodeReviewWorkTime,
        passBackCount
      ),
      fullRunCodeReviewWorkTime
    );
    testerWorkIterations.push(
      ...this.sampleFixWorkIterationTime(fullRunTesterWorkTime, passBackCount),
      fullRunTesterWorkTime
    );
    // QA Automation doesn't require iterations because the person doing it makes sure
    // it's working as expected while doing the work
    const qaAutomationIteration = this.generateQaAutomationWorkIteration();
    const priority = Math.round(Math.random() * 100);

    const ticket = new Ticket(
      this.startingTicketNumber + this.ticketsMade,
      priority,
      programmerWorkIterations,
      programmerCodeReviewWorkIterations,
      testerWorkIterations,
      qaAutomationIteration,
      passBackCount
    );
    this.ticketsMade += 1;
    return ticket;
  }
  generateInitialProgrammerWorkTime() {
    return this.sampleInitialProgrammerWorkTime(1)[0];
  }
  sampleInitialProgrammerWorkTime(sampleCount) {
    if (sampleCount <= 0) {
      return [];
    }
    return this.sampleWorkIterationTime(
      this.maxInitialProgrammerWorkTimeInHours,
      sampleCount
    );
  }
  generateFullRunTesterWorkTime() {
    return this.sampleFullRunTesterWorkTime(1)[0];
  }
  sampleFullRunTesterWorkTime(sampleCount) {
    if (sampleCount <= 0) {
      return [];
    }
    return this.sampleWorkIterationTime(
      this.maxFullRunTesterWorkTimeInHours,
      sampleCount
    );
  }
  sampleWorkIterationTime(maxTimeInHours, sampleCount) {
    if (sampleCount <= 0) {
      return [];
    }
    const minimumWorkTimeInMinutes = 30;
    const sample = PD.rgamma(sampleCount, 3, 0.1).map((maxWorkTimeValue) => {
      const maxWorkTimePercentage = Math.min(maxWorkTimeValue / 100.0, 1);
      return new WorkIteration(
        Math.round(maxTimeInHours * maxWorkTimePercentage * 60) +
          minimumWorkTimeInMinutes
      );
    });
    return sample;
  }
  sampleFixWorkIterationTime(baseWorkIteration, sampleCount) {
    // when a ticket is sent back to the programmer from QA, a fix is likely to take
    // less time than the initial work, but it's still possible for it to take more
    // time. This gamma probability distribution is used to determine the percentage of
    // the initial work time that it will take to fix the issue the tester found. It has
    // a significant lean towards 0% (with a 10 minute minimum), but also makes it
    // possible for the percentage to exceed 100%, meaning it could take longer to
    // create a potential fix than the initial implementation, and this reflects finding
    // a serious issue with the implementation and possibly overall design of the code.
    //
    // For testers, it's similar. But any increases over the base work time can be
    // chalked up to the tester trying to determine what exactly is wrong, or possibly
    // struggling to get the system to work if it's particularly problematic.
    //
    // It's sometimes the same for code review, but this simulation makes the assumption
    // that it is the same for code review as it is for testers checking.
    if (sampleCount <= 0) {
      return [];
    }
    const minimumWorkTimeInMinutes = 30;
    const sample = PD.rgamma(sampleCount, 1, 5).map((fixWorkTimePercentage) => {
      // const fixWorkTimePercentage = Math.min(fixWorkTimeValue / 100.0, 1);
      return new WorkIteration(
        Math.min(
          Math.round(baseWorkIteration.time * fixWorkTimePercentage * 60) +
            minimumWorkTimeInMinutes,
          baseWorkIteration.time
        )
      );
    });
    return sample;
  }
  sampleFixCodeReviewWorkIterationTime(baseWorkIteration, sampleCount) {
    if (sampleCount <= 0) {
      return [];
    }
    const minimumWorkTimeInMinutes = 5;
    const sample = PD.rgamma(sampleCount, 1, 5).map((fixWorkTimePercentage) => {
      // const fixWorkTimePercentage = Math.min(fixWorkTimeValue / 100.0, 1);
      return new WorkIteration(
        Math.min(
          Math.round(baseWorkIteration.time * fixWorkTimePercentage * 60) +
            minimumWorkTimeInMinutes,
          baseWorkIteration.time
        )
      );
    });
    return sample;
  }
  generateCodeReviewWorkIterationTime() {
    return this.sampleCodeReviewWorkIterationTime(1)[0];
  }
  sampleCodeReviewWorkIterationTime(sampleCount) {
    // Very similar to sampleWorkIterationTime, except this doesn't have a minimum of
    // at least 30 minutes of work.
    if (sampleCount <= 0) {
      return [];
    }
    const minimumWorkTimeInMinutes = 5;
    const sample = PD.rgamma(sampleCount, 3, 0.1).map((maxWorkTimeValue) => {
      const maxWorkTimePercentage = Math.min(maxWorkTimeValue / 100.0, 1);
      return new WorkIteration(
        Math.min(
          Math.round(
            this.maxCodeReviewTimeInHours * maxWorkTimePercentage * 60
          ) + minimumWorkTimeInMinutes,
          this.maxCodeReviewTimeInHours * 60
        )
      );
    });
    return sample;
  }

  generateQaAutomationWorkIteration() {
    return this.sampleQaAutomationIterationTime(1)[0];
  }
  sampleQaAutomationIterationTime(sampleCount) {
    // The probability curve is flipped around for this, as QA automation is often
    // beholden to the current implementation that the programmers put in place. So not
    // only would they have to figure out what the programmers left them to work with,
    // but they would also have to engineer likely complex solutions for things like
    // explicit waits. Debugging while they develop can also take much longer as they
    // are likely writing the tests at a higher level, where things are, by
    // definition, more complex.
    //
    // In other words, while other tasks are more likely to trend towards the lower
    // end of their respective possible durations, QA automation is more likely to
    // trend towards the higher end, as it is incredibly unlikely that a QA automation
    // task would take less time.
    if (sampleCount <= 0) {
      return [];
    }
    const minimumWorkTimeInMinutes = 30;
    const sample = PD.rgamma(sampleCount, 3, 0.1).map((workTimeValue) => {
      const workTimePercentage = Math.max(
        (workTimeValue / 100.0 - 1.0) * -1,
        0
      );
      return new WorkIteration(
        Math.round(this.maxQaAutomationTime * workTimePercentage * 60) +
          minimumWorkTimeInMinutes
      );
    });
    return sample;
  }
  generateTicketPassBackCount() {
    return this.sampleTicketPassBackCount(1)[0];
  }
  sampleTicketPassBackCount(sampleCount) {
    if (sampleCount <= 0) {
      return [];
    }
    // return Math.floor(PD.rchisq(1, 1, 5)[0]);
    return PD.rpois(sampleCount, this.averagePassBackCount);
  }
}

class StackLogEntry {
  constructor(
    dayTimeRangeStart,
    dayTimeRangeEnd,
    activeDevelopment,
    waitingForCodeReview,
    inCodeReview,
    waitingForQa,
    inQa,
    beingAutomated,
    sentBack,
    done,
    waitingForAutomation,
    automated
  ) {
    this.dayTimeRangeStart = dayTimeRangeStart;
    this.dayTimeRangeEnd = dayTimeRangeEnd;
    this.activeDevelopment = activeDevelopment;
    this.waitingForCodeReview = waitingForCodeReview;
    this.inCodeReview = inCodeReview;
    this.waitingForQa = waitingForQa;
    this.inQa = inQa;
    this.beingAutomated = beingAutomated;
    this.sentBack = sentBack;
    this.done = done;
    this.waitingForAutomation = waitingForAutomation;
    this.automated = automated;
  }
}

export class Simulation {
  constructor({
    sprintDayCount = 10,
    regressionTestDayCount = 2,
    dayStartTime = 10,
    programmerCount = 5,
    testerCount = 1,
    maxInitialProgrammerWorkTimeInHours = 16,
    maxFullRunTesterWorkTimeInHours = 8,
    maxQaAutomationTime = 8,
    averagePassBackCount = 1,
    checkRefinement = 0.3,
    customEventsByDay = null,
  }) {
    this.dayLengthInMinutes = 480;
    this.dayStartHour = 10;
    this.dayStartTime = dayStartTime;
    this.lunchTime = (12 - this.dayStartTime) * 60;
    this.sprintDayCount = sprintDayCount;
    this.regressionTestDayCount = regressionTestDayCount;
    this.totalDays = this.sprintDayCount + this.regressionTestDayCount;
    this.totalSprintMinutes = sprintDayCount * this.dayLengthInMinutes;
    this.totalSimulationMinutes =
      this.totalSprintMinutes +
      regressionTestDayCount * this.dayLengthInMinutes;
    this.simulationEndDay = this.totalDays;
    this.simulationEndTime = this.dayLengthInMinutes;
    this.simulationEndDayTime = this.dayTimeFromDayAndTime(
      this.simulationEndDay,
      this.simulationEndTime
    );
    this.programmerCount = programmerCount;
    this.testerCount = testerCount;
    this.maxInitialProgrammerWorkTimeInHours = maxInitialProgrammerWorkTimeInHours;
    this.maxFullRunTesterWorkTimeInHours = maxFullRunTesterWorkTimeInHours;
    this.maxQaAutomationTime = maxQaAutomationTime;
    this.averagePassBackCount = averagePassBackCount;
    this.checkRefinement = checkRefinement;
    if (customEventsByDay === null) {
      // One array for each worker, each containing one array for each day of the sprint
      customEventsByDay = [
        ...Array(programmerCount + testerCount).keys(),
      ].map(() => [...Array(this.totalDays).keys()].map(() => []));
    }
    this.prepareWorkers(customEventsByDay);
    this.ticketFactory = new TicketFactory(
      this.maxInitialProgrammerWorkTimeInHours,
      this.maxFullRunTesterWorkTimeInHours,
      this.maxQaAutomationTime,
      this.averagePassBackCount
    );
    this.tickets = [];
    this.sprintTickets = [];
    this.qaStack = [];
    this.needsAutomationStack = [];
    this.automatedStack = [];
    this.passBackStack = [];
    this.doneStack = [];
    this.unfinishedStack = [];
    this.codeReviewStack = [];
    this.stackTimelineHashMap = [];
    this.stackTimelineSets = [];
    this.secretProjectedSprintCountUntilDeadlock = undefined;
  }
  get projectedSprintCountUntilDeadlock() {
    if (this.secretProjectedSprintCountUntilDeadlock === undefined) {
      throw Error("Simulation must simulate to establish a projected deadlock");
    }
    return this.secretProjectedSprintCountUntilDeadlock;
  }
  prepareWorkers(customEventsByDay) {
    this.programmers = [];
    for (let i = 0; i < this.programmerCount; i++) {
      let prog = new Programmer(
        this.sprintDayCount,
        this.regressionTestDayCount,
        this.lunchTime,
        customEventsByDay.shift()
      );
      prog.name = `${Programmer.name} #${i + 1}`;
      prog.color =
        workerIdentifierColors[i % (workerIdentifierColors.length - 1)];
      this.programmers.push(prog);
    }
    this.testers = [];
    for (
      let i = this.programmerCount;
      i < this.testerCount + this.programmerCount;
      i++
    ) {
      let t = new Tester(
        this.sprintDayCount,
        this.regressionTestDayCount,
        this.lunchTime,
        customEventsByDay.shift()
      );
      t.name = `${Tester.name} #${i + 1 - this.programmerCount}`;
      t.color = workerIdentifierColors[i % (workerIdentifierColors.length - 1)];
      this.testers.push(t);
    }
    this.workers = [...this.programmers, ...this.testers];
  }
  simulate() {
    this.currentDay = 0;
    this.currentTime = 0;
    this.currentDayTime = 0;
    let nextCheckInTime = this.getNextCheckInTime();
    this.currentDay = Math.floor(nextCheckInTime / this.dayLengthInMinutes);
    this.currentTime = nextCheckInTime % this.dayLengthInMinutes;
    this.currentDayTime = this.dayTimeFromDayAndTime(
      this.currentDay,
      this.currentTime
    );
    this.previousDay = null;
    this.previousTime = null;
    this.previousDayTime = null;
    while (
      this.currentDayTime <= this.simulationEndDayTime &&
      this.currentDayTime >= 0
    ) {
      // process potentially completed work first
      this.processProgrammerCompletedWork();
      this.processTesterCompletedWork();

      // process handing out new work after all available tickets have been
      // determined
      this.handOutNewProgrammerWork();
      this.backfillUntilDayTimeTesterScheduleForTimeTheySpentDoingNothing(
        this.currentDayTime
      );
      this.handOutNewTesterWork();
      nextCheckInTime = this.getNextCheckInTime();
      if (nextCheckInTime === this.currentDayTime) {
        throw Error("DayTime would not progress");
      }
      this.previousDay = this.currentDay;
      this.previousTime = this.currentTime;
      this.previousDayTime = this.currentDayTime;
      this.currentDay = Math.floor(nextCheckInTime / this.dayLengthInMinutes);
      this.currentTime = nextCheckInTime % this.dayLengthInMinutes;
      this.currentDayTime = this.dayTimeFromDayAndTime(
        this.currentDay,
        this.currentTime
      );
      let logEndTime = this.currentDayTime;

      if (nextCheckInTime < 0) {
        // no more check-ins for this sprint, so set both values to -1 to exit the
        // loop. Add stack log entries from this time to the end of the sprint
        // because whatever the stacks are now will be what they are at the end of
        // the sprint.

        // set log end time to the last minute of the simulated time, so it
        // isn't a negative number
        logEndTime = this.simulationEndDayTime;
      }
      this.generateStackLogEntriesForDayTimeRange(
        this.previousDayTime,
        logEndTime
      );
    }
    this.unfinishedStack.concat([...this.qaStack, ...this.passBackStack]);
    this.aggregateMinutesSpent();
    this.projectDeadlock();
  }
  projectDeadlock() {
    /*
    For each of the tickets in the done stack, consider how much time it took to do a
    complete successful check of the ones that weren't automated. Consider then how much
    this time would be refined (according to this.checkRefinement), and this would be
    the amount of additional time that needs to be allotted for regression checking.

    Consider then the percentage of available checking time that was spent doing
    complete check runs that wouldn't be automated. As the projection goes forward,
    sprint by sprint, the amount of new manual regression checking time will be
    subtracted from the remaining available check time, and the previously mentioned
    percentage will be used to estimate how much manual checking time would need to be
    factored in for how the regression checking period grows for the next sprint.

    In addition to this, when tickets aren't finished in a sprint and time was spent on
    checking iterations of them, the testers will be unable to automate them, so this
    checking time is lost and can't be saved through automation. It is essentially
    fluff, and the percentage of checking time spent on this will be used to estimate
    how much of the potential checking time would be lost each sprint. If all tickets
    that are started in a sprint get finished, then this will be 0. But if it's not 0,
    then it means the programmers are getting an opportunity to squeeze in additional
    work that only applies to subsequent sprints and so it means that there's work the
    testers can't get ahead of in the current sprint, so it will cost them time in the
    future.

    This will be projected forward, counting each sprint that could theoretically be
    done, until the remaining available time for checks is less than it would take to
    do a single checking iteration for a "small" ticket, which, for the purposes of this
    projection, will be considered to be 25% of this.maxFullRunTesterWorkTimeInHours.

    When that point is reached, it would be unreasonable to expect the testers to even
    have the opportunity to try and check something, and thus, progress will be in a
    deadlock.
    */
    if (this.doneStack.length === 0) {
      // Development was so inefficient that literally 0 tickets were finished in the
      // simulated sprint, which means there's not enough data to project into the
      // future to see when a deadlock would occur. This sets the projected sprint count
      // to Infinity to reflect that it would take so long to even get anything done in
      // the first place that it's not even worth considering.
      this.secretProjectedSprintCountUntilDeadlock = Infinity;
      return;
    }
    const totalCheckingMinutes = this.workerDataForDayTime[
      this.workerDataForDayTime.length - 1
    ].cumulativeMinutes.checking;
    const totalSuccessfulCheckTime = this.doneStack.reduce(
      (totalTime, currentTicket) =>
        totalTime + currentTicket.fullTesterWorkIterationTime,
      0
    );
    const newManualCheckTimeEliminatedByAutomation = this.automatedStack.reduce(
      (totalTime, currentTicket) =>
        totalTime + currentTicket.fullTesterWorkIterationTime,
      0
    );
    // time spent checking tickets that wouldn't be finished this sprint
    const fluffCheckingMinutes = this.workerDataForDayTime[
      this.workerDataForDayTime.length - 1
    ].cumulativeMinutes.fluffChecking;
    const percentageOfCheckTimeSpentOnFluffChecking =
      fluffCheckingMinutes / totalCheckingMinutes;
    const newManualCheckTime =
      totalSuccessfulCheckTime - newManualCheckTimeEliminatedByAutomation;
    if (newManualCheckTime <= 0 && fluffCheckingMinutes <= 0) {
      // configuration is theoretically sustainable, as it means all tickets that were
      //planned for a sprint were both completed and had the checking of them automated.
      this.secretProjectedSprintCountUntilDeadlock = null;
      return;
    }

    const percentageOfCheckTimeSpentOnNewManualChecking =
      newManualCheckTime / totalCheckingMinutes;
    let remainingCheckingMinutes = totalCheckingMinutes;
    let sprintsUntilDeadlock = 0;
    const estimatedMinimumCheckTimePerTicket =
      this.maxFullRunTesterWorkTimeInHours * 60 * 0.25;
    while (remainingCheckingMinutes > estimatedMinimumCheckTimePerTicket) {
      let totalNewManualCheckTime = Math.ceil(
        percentageOfCheckTimeSpentOnNewManualChecking * remainingCheckingMinutes
      );
      let totalNewFluffCheckTime = Math.ceil(
        percentageOfCheckTimeSpentOnFluffChecking * remainingCheckingMinutes
      );
      let projectedRefinedNewRegressionCheckMinutes =
        (1 - this.checkRefinement) * totalNewManualCheckTime;

      remainingCheckingMinutes -= projectedRefinedNewRegressionCheckMinutes;
      remainingCheckingMinutes -= totalNewFluffCheckTime;
      sprintsUntilDeadlock++;
    }
    this.secretProjectedSprintCountUntilDeadlock = sprintsUntilDeadlock;
  }
  dayTimeFromDayAndTime(day, time) {
    // given a day and a time, return the dayTime
    return day * this.dayLengthInMinutes + time;
  }
  generateStackLogEntriesForDayTimeRange(dayTimeRangeStart, dayTimeRangeEnd) {
    // take the stacks at the moment of this function being called, and create a
    // series of stack log entries for each minute in the given dayTime range
    let activeDevelopment = this.getTicketsCurrentlyInActiveDevelopment();
    let waitingForCodeReview = this.codeReviewStack.slice();
    let inCodeReview = this.getTicketsCurrentlyInCodeReview();
    let waitingForQa = this.qaStack.slice();
    let waitingForAutomation = this.needsAutomationStack.slice();
    let automated = this.automatedStack.slice();
    let inQa = this.getTicketsCurrentlyInQa();
    let beingAutomated = this.getTicketsCurrentlyBeingAutomated();
    let sentBack = this.passBackStack.slice();
    let done = this.doneStack.slice();
    let logEntry = new StackLogEntry(
      dayTimeRangeStart,
      dayTimeRangeEnd,
      activeDevelopment,
      waitingForCodeReview,
      inCodeReview,
      waitingForQa,
      inQa,
      beingAutomated,
      sentBack,
      done,
      waitingForAutomation,
      automated
    );
    for (let i = dayTimeRangeStart; i < dayTimeRangeEnd; i++) {
      this.stackTimelineHashMap.push(logEntry);
    }
    this.stackTimelineSets.push(logEntry);
  }
  getTicketsCurrentlyInActiveDevelopment() {
    // Iterates over the programmers and grabs all of the tickets that they're
    // working on. Tickets being code reviewed are not considered for this, as they
    // are tracked elsewhere.
    return [
      ...this.programmers.reduce((tickets, programmer) => {
        if (
          programmer.schedule.lastTicketWorkedOn &&
          programmer.schedule.lastTicketWorkedOn.programmerWorkIterations
            .length <
            programmer.schedule.lastTicketWorkedOn
              .programmerCodeReviewWorkIterations.length
        ) {
          tickets.push(programmer.schedule.lastTicketWorkedOn);
        }
        return tickets;
      }, []),
    ];
  }
  getTicketsCurrentlyInCodeReview() {
    return [
      ...this.programmers.reduce((tickets, programmer) => {
        if (
          programmer.schedule.lastTicketWorkedOn &&
          programmer.schedule.lastTicketWorkedOn.programmerWorkIterations
            .length ===
            programmer.schedule.lastTicketWorkedOn
              .programmerCodeReviewWorkIterations.length
        ) {
          tickets.push(programmer.schedule.lastTicketWorkedOn);
        }
        return tickets;
      }, []),
    ];
  }
  getTicketsCurrentlyInQa() {
    return [
      ...this.testers.reduce((tickets, tester) => {
        if (tester.schedule.lastTicketWorkedOn) {
          tickets.push(tester.schedule.lastTicketWorkedOn);
        }
        return tickets;
      }, []),
    ];
  }
  getTicketsCurrentlyBeingAutomated() {
    return [
      ...this.testers.reduce((tickets, tester) => {
        if (
          tester.schedule.lastTicketWorkedOn &&
          tester.schedule.lastTicketWorkedOn.automationWorkIterations.length ===
            0
        ) {
          tickets.push(tester.schedule.lastTicketWorkedOn);
        }
        return tickets;
      }, []),
    ];
  }
  getNextCheckInTime() {
    let earliestWorker = this.getWorkerWithEarliestUpcomingCheckIn();
    if (
      earliestWorker instanceof Tester &&
      this.noAvailableWorkForTesters &&
      this.allProgrammersAreDoneForTheSprint &&
      this.remainingTestersHaveCheckInNow
    ) {
      // The worker with the earliest check-in was found to be a tester, but there's no
      // available work for them, they have nothing to turn in, and all the programmers
      // are done for the rest of the sprint so no new work will become available. Since
      // in this case, only a tester that was just now becoming available would be the
      // earliest worker. But since there's no new work for any of the testers to do, it
      // must mean that the simulation can be finished.
      this.backfillUntilDayTimeTesterScheduleForTimeTheySpentDoingNothing(
        this.totalSimulationMinutes
      );
      return -1;
    }
    if (
      earliestWorker.nextWorkIterationCompletionCheckIn > this.currentDayTime
    ) {
      return earliestWorker.nextWorkIterationCompletionCheckIn;
    } else {
      return earliestWorker.nextAvailabilityCheckIn;
    }
  }
  get noAvailableWorkForTesters() {
    // check for any tickets in either the qaStack or the needsAutomationStack that can
    // be claimed by any tester that is still available this sprint.
    const unavailableTesters = this.testers.filter((t) => t.nextCheckInTime < 0);
    const unclaimableTicketNumbers = unavailableTesters
      .reduce((acc, t) => acc.concat(t.tickets), [])
      .map((ticket) => ticket.ticketNumber);
    const availableTicketNumbers = [...this.qaStack, ...this.needsAutomationStack].map((ticket) => ticket.ticketNumber);
    return availableTicketNumbers.filter((num) => !unclaimableTicketNumbers.includes(num)).length === 0;
  }
  get allProgrammersAreDoneForTheSprint() {
    return this.programmers.every((p) => p.nextCheckInTime < 0);
  }
  get remainingTestersHaveCheckInNow() {
    return this.testers
      .map((t) => t.nextCheckInTime)
      .filter((t) => t > 0)
      .every((t) => t === this.currentDayTime);
  }
  getWorkerWithEarliestUpcomingCheckIn() {
    // Skip ahead to the next relevant point in time. This will either be the
    // next time a worker finishes an iteration of work for a ticket, or the
    // next time a worker is available for work. These are different times
    // because a worker can finish the iteration of work for a ticket, but then
    // have a meeting before they can begin work on another ticket. This is
    // important because if they didn't wait until after the meeting to grab the
    // next available ticket for them, another, more important ticket could
    // become available for them (e.g. a ticket that had to be sent back because
    // the tester found a problem, or a programmer sent a higher priority ticket
    // to QA).
    //
    // The current day and time are needed to rule out potential check-in points
    // that have already passed. If they are in the past, they must have already
    // been handled, or, in the case of the tester, they are waiting for work to
    // become available.
    return this.workers.reduce((eWorker, nWorker) => {
      // eWorker: Probable worker with earliest check-in
      // nWorker: The next worker in the iteration.
      // both workers have a check-in time this sprint, so determine which is earlier,
      // provided both have relevant check-ins coming up.
      if (eWorker.nextAvailabilityCheckIn <= this.currentDayTime) {
        // Both of the eWorker's check-ins are in the past, or were just performed.
        // Even if the next nWorker has no check-ins coming up, there will
        // eventually be an nWorker that does, because it would be impossible for
        // all workers to have check-ins in the past if not all had a -1 check-in.
        return nWorker;
      } else if (nWorker.nextAvailabilityCheckIn <= this.currentDayTime) {
        // If eWorker check-ins are not entirely in the past, but nWorker's are,
        // then eWorker moves because it's the only relevant worker in this
        // comparison.
        return eWorker;
      }
      if (
        eWorker.nextAvailabilityCheckIn <
        eWorker.nextWorkIterationCompletionCheckIn
      ) {
        throw new Error("No.");
      }
      // Both have check-ins coming up. Find each of their earliest upcoming check-ins
      // and compare them to determine which worker moves forward.
      // at least one of eWorker's check-ins would have to be coming up
      let eWorkerRelevantCheckIn;
      if (eWorker.nextWorkIterationCompletionCheckIn > this.currentDayTime) {
        // Worker has an upcoming work completion check-in. Work completion
        // check-ins must always come before, or be at the same time as availability
        // check-ins. If the completion check-in is earlier, then it must be the
        // one we want. If it's at the same time as the availability check-in, then
        // it doesn't matter which we use, so the logic is simpler if we defer to
        // the completion check-in.
        eWorkerRelevantCheckIn = eWorker.nextWorkIterationCompletionCheckIn;
      } else {
        // The work completion check-in must have been in the past, leaving the
        // availability check-in as the only upcoming check-in for this worker.
        eWorkerRelevantCheckIn = eWorker.nextAvailabilityCheckIn;
      }
      let nWorkerRelevantCheckIn;
      if (nWorker.nextWorkIterationCompletionCheckIn > this.currentDayTime) {
        // Worker has an upcoming work completion check-in. Work completion
        // check-ins must always come before, or be at the same time as availability
        // check-ins. If the completion check-in is earlier, then it must be the
        // one we want. If it's at the same time as the availability check-in, then
        // it doesn't matter which we use, so the logic is simpler if we defer to
        // the completion check-in.
        nWorkerRelevantCheckIn = nWorker.nextWorkIterationCompletionCheckIn;
      } else {
        // The work completion check-in must have been in the past, leaving the
        // availability check-in as the only upcoming check-in for this worker.
        nWorkerRelevantCheckIn = nWorker.nextAvailabilityCheckIn;
      }
      return eWorkerRelevantCheckIn > nWorkerRelevantCheckIn
        ? nWorker
        : eWorker;
    });
  }
  processProgrammerCompletedWork() {
    for (let p of this.programmers) {
      if (p.nextWorkIterationCompletionCheckIn !== this.currentDayTime) {
        continue;
      }
      let possiblyFinishedTicket = p.schedule.lastTicketWorkedOn;
      p.schedule.lastTicketWorkedOn = null;
      if (possiblyFinishedTicket.needsCodeReview) {
        this.codeReviewStack.push(possiblyFinishedTicket);
      } else {
        this.qaStack.push(possiblyFinishedTicket);
      }
      p.nextWorkIterationCompletionCheckIn = null;
    }
  }
  processTesterCompletedWork() {
    for (let t of this.testers) {
      if (t.nextWorkIterationCompletionCheckIn === this.currentDayTime) {
        let possiblyFinishedTicket = t.schedule.lastTicketWorkedOn;
        t.schedule.lastTicketWorkedOn = null;
        if (possiblyFinishedTicket.testerWorkIterations.length > 0) {
          // tester must have found a problem, so send it back to programmers
          this.passBackStack.push(possiblyFinishedTicket);
          possiblyFinishedTicket.firstIteration = false;
        } else if (!possiblyFinishedTicket.needsAutomation) {
          // automation was just completed
          this.automatedStack.push(possiblyFinishedTicket);
        } else {
          // no work iterations left, which means the tester didn't find any
          // issues
          // possiblyFinishedTicket.needsAutomation = true;
          this.doneStack.push(possiblyFinishedTicket);
          this.needsAutomationStack.push(possiblyFinishedTicket);
          possiblyFinishedTicket.unfinished = false;
        }
        t.nextWorkIterationCompletionCheckIn = null;
      }
    }
  }
  handOutNewProgrammerWork() {
    // For every programmer, find the ones that are available for work.
    // For every one of those programmers, find the highest priority ticket in the
    // passBackStack that belongs to them (if any), and find the highest priority
    // ticket in the codeReviewStack that doesn't belong to them (if any). Of those
    // two tickets, determine which is the higher priority one, and have the
    // programmer work on that one. If they are the same priority, have the
    // programmer do the code review as that is holding back another programmer, and
    // it will take an hour or less to complete.
    //
    // If there are no existing tickets available for the programmer, then create a
    // new one to assign to them. This can be considered to be either already
    // planned work for the sprint, or work that was pulled into the sprint from the
    // backlog. Either way, a programmer should always have work available to do.
    for (let p of this.programmers) {
      if (
        p.nextAvailabilityCheckIn > 0 &&
        p.nextAvailabilityCheckIn < this.currentDayTime
      ) {
        throw new Error("Programmer is being left behind");
      }
      if (
        p.nextAvailabilityCheckIn !== this.currentDayTime ||
        p.nextAvailabilityCheckIn < 0
      ) {
        continue;
      }
      // can start new work
      let ticket = null;
      if (this.passBackStack.length > 0 || this.codeReviewStack.length > 0) {
        let highestPriorityPassBackTicketIndex = this.getHighestPriorityPassBackWorkIndexForProgrammer(
          p
        );
        let highestPriorityCodeReviewTicketIndex = this.getHighestPriorityCodeReviewWorkIndexForProgrammer(
          p
        );
        if (
          highestPriorityPassBackTicketIndex !== null &&
          highestPriorityCodeReviewTicketIndex !== null
        ) {
          if (
            this.passBackStack[highestPriorityPassBackTicketIndex].priority <
            this.codeReviewStack[highestPriorityCodeReviewTicketIndex].priority
          ) {
            ticket = this.passBackStack.splice(
              highestPriorityPassBackTicketIndex,
              1
            )[0];
          } else {
            // code review should be done if it takes higher priority or it's of
            // equivalent priority (because it takes less time)
            ticket = this.codeReviewStack.splice(
              highestPriorityCodeReviewTicketIndex,
              1
            )[0];
          }
        } else if (highestPriorityPassBackTicketIndex !== null) {
          ticket = this.passBackStack.splice(
            highestPriorityPassBackTicketIndex,
            1
          )[0];
        } else if (highestPriorityCodeReviewTicketIndex !== null) {
          ticket = this.codeReviewStack.splice(
            highestPriorityCodeReviewTicketIndex,
            1
          )[0];
        }
      }
      if (!ticket) {
        ticket = this.ticketFactory.generateTicket();
        ticket.workStartDayTime = this.currentDayTime;
        p.addTicket(ticket);
        this.tickets.push(ticket);
        if (this.currentDay < this.sprintDayCount) {
          this.sprintTickets.push(ticket);
        }
      }
      try {
        const iterationComplete = p.schedule.addWork(ticket);
        if (iterationComplete !== false) {
          p.nextWorkIterationCompletionCheckIn = iterationComplete;
        }
      } catch (err) {
        if (err instanceof RangeError) {
          // ran out of time in the sprint
          p.nextWorkIterationCompletionCheckIn = -1;
          this.unfinishedStack.push(ticket);
        } else {
          throw err;
        }
      }
    }
  }
  getHighestPriorityPassBackWorkIndexForProgrammer(programmer) {
    let ownedTickets = programmer.tickets.map((ticket) => ticket.number);
    // needs to get highest priority ticket that belongs to them
    return this.passBackStack.reduce(
      (highestPriorityOwnedTicketIndex, currentTicket, currentTicketIndex) => {
        if (ownedTickets.includes(currentTicket.number)) {
          if (!highestPriorityOwnedTicketIndex) {
            return currentTicketIndex;
          }
          if (
            currentTicket.priority <
            this.passBackStack[highestPriorityOwnedTicketIndex].priority
          ) {
            return currentTicketIndex;
          }
        }
        return highestPriorityOwnedTicketIndex;
      },
      null
    );
  }
  getHighestPriorityCodeReviewWorkIndexForProgrammer(programmer) {
    let ownedTickets = programmer.tickets.map((ticket) => ticket.number);

    // needs to get highest priority ticket that doesn't belongs to them
    return this.codeReviewStack.reduce(
      (highestPriorityOwnedTicketIndex, currentTicket, currentTicketIndex) => {
        if (!ownedTickets.includes(currentTicket.number)) {
          if (!highestPriorityOwnedTicketIndex) {
            return currentTicketIndex;
          }
          if (
            currentTicket.priority <
            this.codeReviewStack[highestPriorityOwnedTicketIndex].priority
          ) {
            return currentTicketIndex;
          }
        }
        return highestPriorityOwnedTicketIndex;
      },
      null
    );
  }
  getHighestPriorityAutomationIndex() {
    return this.needsAutomationStack.reduce(
      (highestPriorityTicketIndex, currentTicket, currentTicketIndex) => {
        if (!highestPriorityTicketIndex) {
          return currentTicketIndex;
        }
        if (
          currentTicket.priority <
          this.needsAutomationStack[highestPriorityTicketIndex].priority
        ) {
          return currentTicketIndex;
        }
        return highestPriorityTicketIndex;
      },
      null
    );
  }
  handOutNewTesterWork() {
    for (let t of this.testers) {
      if (t.nextAvailabilityCheckIn < 0) {
        // can't accept new work
        continue;
      }
      if (t.nextAvailabilityCheckIn < this.currentDayTime) {
        this.backfillUntilDayTimeTesterScheduleForTimeTheySpentDoingNothing(this.currentDayTime);
      }
      if (t.nextAvailabilityCheckIn === this.currentDayTime) {
        // can start new work
        let ticket = null;
        if (this.qaStack.length > 0) {
          let highestPriorityTicketIndex = this.getHighestPriorityCheckingWorkIndexForTester(
            t
          );
          if (highestPriorityTicketIndex !== null) {
            ticket = this.qaStack.splice(highestPriorityTicketIndex, 1)[0];
          }
        }
        if (!ticket && this.needsAutomationStack.length > 0) {
          // automation takes a lower priority than checking by hand
          let highestPriorityTicketIndex = this.getHighestPriorityAutomationIndex();
          if (highestPriorityTicketIndex !== null) {
            ticket = this.needsAutomationStack.splice(
              highestPriorityTicketIndex,
              1
            )[0];
          }
        }
        if (!ticket) {
          // tester can't do anything at the moment
          continue;
        }
        try {
          const iterationComplete = t.schedule.addWork(ticket);
          if (iterationComplete !== false) {
            t.nextWorkIterationCompletionCheckIn = iterationComplete;
          }
        } catch (err) {
          if (err instanceof RangeError) {
            // ran out of time in the sprint
            t.nextWorkIterationCompletionCheckIn = -1;
            this.unfinishedStack.push(ticket);
          } else {
            throw err;
          }
        }
      }
    }
  }
  backfillUntilDayTimeTesterScheduleForTimeTheySpentDoingNothing(
    targetDayTime
  ) {
    // necessary to avoid logic issues towards the end of the sprint where next
    // available time is determined.
    const targetDay = Math.floor(targetDayTime / this.dayLengthInMinutes);
    const targetTime = Math.floor(targetDayTime % this.dayLengthInMinutes);
    for (let t of this.testers) {
      for (let daySchedule of t.schedule.daySchedules) {
        if (daySchedule.day > targetDay) {
          break;
        }
        while (daySchedule.availableTimeSlots.length > 0) {
          const timeSlot = daySchedule.availableTimeSlots[0];
          if (
            daySchedule.day === targetDay &&
            timeSlot.startTime >= targetTime
          ) {
            break;
          }
          const timeSlotStartDayTime =
            this.dayLengthInMinutes * daySchedule.day + timeSlot.startTime;
          const nothingDuration = Math.min(
            timeSlot.duration,
            targetDayTime - timeSlotStartDayTime
          );
          daySchedule.scheduleMeeting(
            new NothingEvent(
              timeSlot.startTime,
              nothingDuration,
              daySchedule.day
            )
          );
        }
      }
    }
  }
  getHighestPriorityCheckingWorkIndexForTester(tester) {
    let ownedTickets = tester.tickets.map((ticket) => ticket.number);
    return this.qaStack.reduce(
      (highestPriorityTicketIndex, currentTicket, currentTicketIndex) => {
        // if the ticket.firstIteration is true, then the ticket hasn't been claimed by
        // a tester yet, so it's up for grabs.
        if (
          ownedTickets.includes(currentTicket.number) ||
          currentTicket.firstIteration
        ) {
          if (!highestPriorityTicketIndex) {
            return currentTicketIndex;
          }
          if (
            currentTicket.priority <
            this.qaStack[highestPriorityTicketIndex].priority
          ) {
            return currentTicketIndex;
          }
        }
        return highestPriorityTicketIndex;
      },
      null
    );
  }
  aggregateMinutesSpent() {
    // Example for getting time spent context switching at minute 321
    // worker 0: this.workerDataForDayTime[321].workers[0].contextSwitching
    // all together: this.workerDataForDayTime[321].cumulativeMinutes.contextSwitching
    this.workerDataForDayTime = [];

    for (let i = 0; i < this.totalSimulationMinutes; i++) {
      let dataForWorkersAtThisDayTime = [];
      for (let worker of this.workers) {
        let minutes = {
          meeting: worker.getMeetingMinutesAtDayTime(i),
          contextSwitching: worker.getContextSwitchingMinutesAtDayTime(i),
          productiveTicketWork: worker.getProductiveTicketWorkMinutesAtDayTime(
            i
          ),
          redundantTicketWork: worker.getRedundantTicketWorkMinutesAtDayTime(i),
          codeReview: worker.getCodeReviewMinutesAtDayTime(i),
          // recovery: worker.getProductivityRecoveryMinutesAtDayTime(i),
          checking: worker.getCheckingMinutesAtDayTime(i),
          fluffChecking: worker.getFluffCheckingMinutesAtDayTime(i),
          nonFluffChecking: worker.getNonFluffCheckingMinutesAtDayTime(i),
          regressionTesting: worker.getRegressionTestingMinutesAtDayTime(i),
          automation: worker.getAutomationMinutesAtDayTime(i),
          nothing: worker.getNothingMinutesAtDayTime(i),
        };
        dataForWorkersAtThisDayTime.push(minutes);
      }
      let cumulativeMinutesForDayTime = dataForWorkersAtThisDayTime.reduce(
        (acc, worker) => {
          let newAcc = {};
          for (let minuteName in worker) {
            newAcc[minuteName] = acc[minuteName] + worker[minuteName];
          }
          return newAcc;
        }
      );
      dataForWorkersAtThisDayTime["all"] = cumulativeMinutesForDayTime;

      this.workerDataForDayTime.push({
        workers: dataForWorkersAtThisDayTime,
        cumulativeMinutes: cumulativeMinutesForDayTime,
        logEntry: this.stackTimelineHashMap[i],
        prettyDayTime: this.getPrettyFormattedDayTime(i),
      });
    }
  }
  getPrettyFormattedDayTime(dayTime) {
    let day = parseInt(dayTime / this.dayLengthInMinutes) + 1;
    let hour =
      (parseInt(((dayTime % this.dayLengthInMinutes) + 1) / 60) +
        this.dayStartHour) %
        12 || 12;
    let minute = (dayTime + 1) % 60;
    return `Day ${day} ${hour}:${minute < 10 ? 0 : ""}${minute}`;
  }
}
