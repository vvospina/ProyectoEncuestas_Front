import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvailableSurveys } from './available-surveys';

describe('AvailableSurveys', () => {
  let component: AvailableSurveys;
  let fixture: ComponentFixture<AvailableSurveys>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableSurveys],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableSurveys);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
