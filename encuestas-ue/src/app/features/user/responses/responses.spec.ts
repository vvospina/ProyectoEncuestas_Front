import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Responses } from './responses';

describe('Responses', () => {
  let component: Responses;
  let fixture: ComponentFixture<Responses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Responses],
    }).compileComponents();

    fixture = TestBed.createComponent(Responses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
