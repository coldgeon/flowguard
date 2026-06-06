import { demoSteps } from "../data/mockData.js";

function DemoRail({ activePage, onSelectStep, onNextStep, message }) {
  const activeIndex = Math.max(0, demoSteps.findIndex((step) => step.page === activePage));
  const activeStep = demoSteps[activeIndex] || demoSteps[0];

  return (
    <div className="demo-rail compact-demo-rail" aria-label="발표 시연 흐름">
      <div className="demo-current">
        <span>STEP {activeIndex + 1}/{demoSteps.length}</span>
        <strong>{activeStep.label}</strong>
        <small>{message || activeStep.talkTrack}</small>
      </div>
      <div className="demo-dots" aria-label="시연 단계 이동">
        {demoSteps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            aria-label={`${index + 1}. ${step.label}`}
            className={index === activeIndex ? "active" : index < activeIndex ? "done" : ""}
            onClick={() => onSelectStep(step)}
          />
        ))}
      </div>
      <button className="demo-next" type="button" onClick={onNextStep}>다음 장면</button>
    </div>
  );
}

export default DemoRail;
