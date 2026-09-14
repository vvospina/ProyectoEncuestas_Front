import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurveySuccess } from './survey-success';

describe('SurveySuccess', () => {
  let component: SurveySuccess;
  let fixture: ComponentFixture<SurveySuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveySuccess],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveySuccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
